<?php

namespace App\Http\Controllers;

use App\Http\Requests\Instructions\StoreInstructionRequest;
use App\Http\Resources\NurseInstructionResource;
use App\Models\NurseInstruction;
use App\Models\Patient;
use Illuminate\Http\Request;

class NurseInstructionController extends Controller
{
    public function store(StoreInstructionRequest $request, Patient $patient)
    {
        $user = $request->user();
        if (!in_array($user->role, ['doctor','doctor-manager','admin'], true)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $data = $request->validated();

        $instruction = NurseInstruction::create([
            'patient_id' => $patient->id,
            'consultation_id' => $data['consultation_id'] ?? null,
            'created_by_doctor_id' => $user->id,
            'assigned_to_nurse_id' => $data['assigned_to_nurse_id'] ?? null,
            'instruction' => $data['instruction'],
            'status' => 'pending',
        ])->load([
            'patient',
            'createdByDoctor',
            'assignedToNurse',
            'completedByNurse',
        ]);

        return (new NurseInstructionResource($instruction))
            ->response()
            ->setStatusCode(201);
    }

  public function myInstructions(Request $request)
{
    $user = $request->user();
    if (!in_array($user->role, ['nurse','receptionist-nurse','admin'], true)) {
        return response()->json(['message' => 'Forbidden'], 403);
    }

    $q = NurseInstruction::query()
        ->with(['patient','createdByDoctor'])
        ->orderBy('status')
        ->orderByDesc('id');

    // nurse sees only assigned instructions (كما اتفقنا)
    if (in_array($user->role, ['nurse','receptionist-nurse'], true)) {
        $q->where('assigned_to_nurse_id', $user->id);
    }

    // filter by status (pending/completed)
    if ($request->filled('status')) {
        $q->where('status', $request->string('status')->toString());
    }

    // ✅ server-side search by patient_code
    if ($request->filled('patient_code')) {
        $code = trim($request->string('patient_code')->toString());
        $q->whereHas('patient', function ($qq) use ($code) {
            $qq->where('patient_code', 'like', "%{$code}%");
        });
    }

    if ($request->filled('treatment_date')) {
        $date = $request->string('treatment_date')->toString();
        $q->whereDate('created_at', $date);
    }

    $p = $q->paginate(15);
    $lastUpdated = $q->max('updated_at');

    return response()->json([
        'data' => $p->items(),
        'meta' => [
            'current_page' => $p->currentPage(),
            'last_page' => $p->lastPage(),
            'total' => $p->total(),
            'per_page' => $p->perPage(),
        ],
        'last_updated' => $lastUpdated ? (string) $lastUpdated : null,
    ]);
}


    public function complete(NurseInstruction $instruction)
    {
        $user = request()->user();
        if (!in_array($user->role, ['nurse','receptionist-nurse','admin'], true)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if (in_array($user->role, ['nurse','receptionist-nurse'], true)) {
            if ($instruction->assigned_to_nurse_id !== null
                && (int)$instruction->assigned_to_nurse_id !== (int)$user->id) {
                return response()->json(['message' => 'Forbidden'], 403);
            }
        }

        // إذا راهي completed بالفعل، نرجع نفس الشيء
        if ($instruction->status !== 'completed') {
            $instruction->update([
                'status' => 'completed',
                'completed_by_nurse_id' => $user->id,
                'completed_at' => now(),
            ]);
        }

        $instruction->load(['patient','createdByDoctor','assignedToNurse','completedByNurse']);

        return new NurseInstructionResource($instruction);
    }
}
