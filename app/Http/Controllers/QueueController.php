<?php

namespace App\Http\Controllers;

use App\Models\QueueEntry;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use App\Models\DailyQueue;
use App\Http\Resources\QueueEntryResource;


class QueueController extends Controller
{
    // GET /api/public/queue/today
    public function publicToday(Request $request)
    {
        $date = now()->toDateString();

        $queue = DailyQueue::firstOrCreate(
            ['queue_date' => $date],
            ['current_number' => 0]
        );

        $waitingCount = QueueEntry::where('daily_queue_id', $queue->id)
            ->where('status', 'waiting')
            ->count();

        $lastUpdated = QueueEntry::where('daily_queue_id', $queue->id)->max('updated_at');

        return response()->json([
            'date' => $queue->queue_date->toDateString(),
            'current_number' => $queue->current_number,
            'waiting_count' => $waitingCount,
            'last_updated' => $lastUpdated ? (string) $lastUpdated : (string) $queue->updated_at,
        ]);
    }

    // GET /api/queue/today
    public function today(Request $request)
    {
        $user = $request->user();
        if (!in_array($user->role, ['receptionist','receptionist-nurse','doctor','doctor-manager','admin'], true)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $date = now()->toDateString();
        $status = $request->query('status', 'waiting');
        $perPage = (int) $request->query('per_page', 10);
        $perPage = max(1, min($perPage, 50));
        $page = (int) $request->query('page', 1);

        $queue = DailyQueue::firstOrCreate(
            ['queue_date' => $date],
            ['current_number' => 0]
        );

        $rowsQuery = QueueEntry::with(['patient', 'consultation'])
            ->where('daily_queue_id', $queue->id)
            ->orderByDesc('priority')
            ->orderBy('number');

        if ($status === 'waiting') {
            $rowsQuery->where('status', 'waiting');
        } elseif ($status === 'consulted') {
            $rowsQuery->where('status', 'consulted');
        } elseif ($status === 'in_consultation') {
            $rowsQuery->where('status', 'in_consultation');
        } elseif ($status === 'cancelled') {
            $rowsQuery->where('status', 'cancelled');
        } elseif ($status !== 'all') {
            throw ValidationException::withMessages(['status' => 'Invalid status filter']);
        }

        $rows = $rowsQuery->paginate($perPage, ['*'], 'page', $page);

        $waitingCount = QueueEntry::where('daily_queue_id', $queue->id)
            ->where('status', 'waiting')
            ->count();

        $currentEntry = null;
        if ($queue->current_number > 0) {
            $currentEntry = QueueEntry::with(['patient', 'consultation'])
                ->where('daily_queue_id', $queue->id)
                ->where('number', $queue->current_number)
                ->first();
        }

        $lastUpdated = QueueEntry::where('daily_queue_id', $queue->id)->max('updated_at');

        return response()->json([
            'date' => $queue->queue_date->toDateString(),
            'current_number' => $queue->current_number,
            'waiting_count' => $waitingCount,
            'current_entry' => $currentEntry ? (new QueueEntryResource($currentEntry))->resolve() : null,
            'rows' => QueueEntryResource::collection($rows->items())->resolve(),
            'meta' => [
                'current_page' => $rows->currentPage(),
                'last_page' => $rows->lastPage(),
                'total' => $rows->total(),
                'per_page' => $rows->perPage(),
            ],
            'last_updated' => $lastUpdated ? (string) $lastUpdated : (string) $queue->updated_at,
        ]);
    }

    // POST /api/queue/add
    public function add(Request $request)
    {
        $user = $request->user();
        if (!in_array($user->role, ['receptionist','receptionist-nurse','admin'], true)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $data = $request->validate([
            'patient_id' => ['required','integer','exists:patients,id'],
        ]);

        $date = now()->toDateString();

        return DB::transaction(function () use ($date, $data) {
            $queue = DailyQueue::lockForUpdate()->firstOrCreate(
                ['queue_date' => $date],
                ['current_number' => 0]
            );

            $exists = QueueEntry::where('daily_queue_id', $queue->id)
                ->where('patient_id', $data['patient_id'])
                ->whereIn('status', ['waiting','in_consultation'])
                ->first();

            if ($exists) {
                return response()->json(['message' => 'Patient already in today queue'], 409);
            }

            $nextNumber = (int) QueueEntry::where('daily_queue_id', $queue->id)->max('number') + 1;

            $entry = QueueEntry::create([
                'daily_queue_id' => $queue->id,
                'patient_id' => $data['patient_id'],
                'number' => $nextNumber,
                'priority' => 0,
                'status' => 'waiting',
            ]);

            return (new QueueEntryResource($entry->load('patient')))
                ->response()
                ->setStatusCode(201);
        });
    }

    // POST /api/queue/next
    public function next(Request $request)
    {
        $user = $request->user();
        if (!in_array($user->role, ['doctor','doctor-manager','admin'], true)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $today = now()->toDateString();

        return DB::transaction(function () use ($today) {
            $queue = DailyQueue::lockForUpdate()->firstOrCreate(
                ['queue_date' => $today],
                ['current_number' => 0]
            );

            $currentEntry = QueueEntry::where('daily_queue_id', $queue->id)
                ->where('number', $queue->current_number)
                ->where('status', 'in_consultation')
                ->first();

            if ($currentEntry) {
                $currentEntry->loadMissing('consultation');
                if ($currentEntry->consultation && $currentEntry->consultation->price_cents === null) {
                    return response()->json([
                        'message' => 'Set consultation price or mark free before moving to next.',
                    ], 409);
                }
                $currentEntry->update(['status' => 'consulted']);
            }

            $lastRegularNumber = (int) QueueEntry::where('daily_queue_id', $queue->id)
                ->where('priority', 0)
                ->whereIn('status', ['consulted', 'in_consultation'])
                ->max('number');

            $next = QueueEntry::where('daily_queue_id', $queue->id)
                ->where('status', 'waiting')
                ->where('priority', '>', 0)
                ->orderByDesc('priority')
                ->orderBy('number')
                ->first();

            if (!$next) {
                $next = QueueEntry::where('daily_queue_id', $queue->id)
                    ->where('status', 'waiting')
                    ->where('priority', 0)
                    ->where('number', '>', $lastRegularNumber)
                    ->orderBy('number')
                    ->first();
            }

            if (!$next) {
                $next = QueueEntry::where('daily_queue_id', $queue->id)
                    ->where('status', 'waiting')
                    ->where('priority', 0)
                    ->orderBy('number')
                    ->first();
            }

            if (!$next) {
                return response()->json([
                    'message' => 'No more waiting patients',
                    'current_number' => $queue->current_number,
                ], 200);
            }

            $queue->update(['current_number' => $next->number]);

            return response()->json([
                'message' => 'OK',
                'current_number' => $queue->current_number,
            ]);
        });
    }

    // POST /api/queue/{entry}/priority
    public function priority(Request $request, QueueEntry $entry)
    {
        $user = $request->user();
        if (!in_array($user->role, ['receptionist','receptionist-nurse','admin'], true)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $entry->loadMissing('dailyQueue');
        if ($entry->dailyQueue?->queue_date?->toDateString() !== now()->toDateString()) {
            throw ValidationException::withMessages(['queue' => 'Not today entry']);
        }

        if ($entry->status !== 'waiting') {
            return response()->json(['message' => 'Only waiting entries can be prioritized'], 409);
        }

        $entry->update([
            'priority' => now()->timestamp,
        ]);

        return response()->json([
            'message' => 'Prioritized',
            'entry' => new QueueEntryResource($entry->fresh()->load('patient')),
        ]);
    }

    // POST /api/queue/{entry}/cancel
    public function cancel(Request $request, QueueEntry $entry)
    {
        $user = $request->user();
        if (!in_array($user->role, ['receptionist','receptionist-nurse','admin'], true)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $entry->loadMissing('dailyQueue');
        if ($entry->dailyQueue?->queue_date?->toDateString() !== now()->toDateString()) {
            throw ValidationException::withMessages(['queue' => 'Not today entry']);
        }

        if (!in_array($entry->status, ['waiting','cancelled'], true)) {
            return response()->json(['message' => 'Cannot cancel this entry'], 409);
        }

        $entry->update(['status' => 'cancelled']);

        return response()->json([
            'message' => 'Cancelled',
            'entry' => new QueueEntryResource($entry->fresh()->load('patient')),
        ]);
    }
}
