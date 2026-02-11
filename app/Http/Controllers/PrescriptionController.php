<?php

namespace App\Http\Controllers;

use App\Http\Requests\Prescriptions\StorePrescriptionRequest;
use App\Models\Consultation;
use App\Http\Resources\PrescriptionResource; 
use App\Models\Prescription;
use Illuminate\Support\Facades\DB;

class PrescriptionController extends Controller
{
    public function show(Consultation $consultation)
{
    $this->authorizeDoctor($consultation);

    $prescription = $consultation->prescription()->with('items')->first();

    return $prescription
        ? new PrescriptionResource($prescription)
        : response()->json(null, 204);
}

public function store(StorePrescriptionRequest $request, Consultation $consultation)
{
    $this->authorizeDoctor($consultation);

    if ($consultation->prescription) {
        return response()->json(['message' => 'Prescription already exists'], 409);
    }

    $prescription = DB::transaction(function () use ($request, $consultation) {
        $p = $consultation->prescription()->create();
        $p->items()->createMany($request->items);
        return $p->load('items');
    });

    return (new PrescriptionResource($prescription))->response()->setStatusCode(201);
}

public function update(StorePrescriptionRequest $request, Consultation $consultation)
{
    $this->authorizeDoctor($consultation);

    $prescription = $consultation->prescription;
    if (!$prescription) {
        return response()->json(['message' => 'Prescription not found'], 404);
    }

    $prescription = DB::transaction(function () use ($request, $prescription) {
        $prescription->items()->delete();
        $prescription->items()->createMany($request->items);
        return $prescription->load('items');
    });

    return new PrescriptionResource($prescription);
}

    private function authorizeDoctor(Consultation $consultation): void
    {
        $user = request()->user();

        if (!in_array($user->role, ['doctor','doctor-manager','admin'], true)) {
            abort(403);
        }

        if ($user->role === 'doctor' && (int)$consultation->doctor_id !== (int)$user->id) {
            abort(403);
        }
    }
}
