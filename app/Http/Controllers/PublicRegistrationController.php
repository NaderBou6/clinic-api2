<?php

namespace App\Http\Controllers;

use App\Http\Resources\PatientResource;
use App\Http\Resources\QueueEntryResource;
use App\Models\DailyQueue;
use App\Models\Patient;
use App\Models\QueueEntry;
use App\Services\PatientCodeService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PublicRegistrationController extends Controller
{
    public function store(Request $request, PatientCodeService $codeService)
    {
        $data = $request->validate([
            'first_name' => ['required', 'string', 'max:80'],
            'last_name' => ['required', 'string', 'max:80'],
            'phone' => ['required', 'string', 'max:30'],
            'dob' => ['nullable', 'date'],
            'gender' => ['nullable', 'in:male,female'],
            'address' => ['nullable', 'string', 'max:255'],
            'medical_history_summary' => ['nullable', 'string', 'max:1000'],
        ]);

        $phone = trim($data['phone']);
        $query = Patient::where('phone', $phone);
        if (!empty($data['dob'])) {
            $query->whereDate('dob', $data['dob']);
        }

        $patient = $query->first();
        $isNew = false;

        if (!$patient) {
            $patient = Patient::create([
                'patient_code' => $codeService->generate(),
                'first_name' => trim($data['first_name']),
                'last_name' => trim($data['last_name']),
                'phone' => $phone,
                'dob' => $data['dob'] ?? null,
                'gender' => $data['gender'] ?? null,
                'address' => isset($data['address']) ? trim((string) $data['address']) : null,
                'medical_history_summary' => isset($data['medical_history_summary'])
                    ? trim((string) $data['medical_history_summary'])
                    : null,
            ]);
            $isNew = true;
        }

        $today = now()->toDateString();

        $result = DB::transaction(function () use ($today, $patient) {
            $queue = DailyQueue::lockForUpdate()->firstOrCreate(
                ['queue_date' => $today],
                ['current_number' => 0]
            );

            $existing = QueueEntry::where('daily_queue_id', $queue->id)
                ->where('patient_id', $patient->id)
                ->whereIn('status', ['waiting', 'in_consultation'])
                ->first();

            if ($existing) {
                return ['entry' => $existing, 'already_in_queue' => true];
            }

            $nextNumber = (int) QueueEntry::where('daily_queue_id', $queue->id)->max('number') + 1;

            $entry = QueueEntry::create([
                'daily_queue_id' => $queue->id,
                'patient_id' => $patient->id,
                'number' => $nextNumber,
                'priority' => 0,
                'status' => 'waiting',
            ]);

            return ['entry' => $entry, 'already_in_queue' => false];
        });

        $entry = $result['entry']->load('patient');

        return response()->json([
            'message' => $result['already_in_queue']
                ? 'Patient already in today queue'
                : ($isNew ? 'New patient registered' : 'Existing patient registered'),
            'already_registered' => !$isNew,
            'already_in_queue' => $result['already_in_queue'],
            'patient' => (new PatientResource($patient))->resolve(),
            'queue_entry' => (new QueueEntryResource($entry))->resolve(),
        ]);
    }
}
