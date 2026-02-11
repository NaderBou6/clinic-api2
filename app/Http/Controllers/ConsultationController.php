<?php

namespace App\Http\Controllers;

use App\Http\Requests\Consultations\SetPriceRequest;
use App\Http\Requests\Consultations\StoreConsultationRequest;
use App\Http\Resources\ConsultationResource;
use App\Models\Appointment;
use App\Models\Consultation;
use App\Models\Patient;
use App\Services\ConsultationNumberService;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ConsultationController extends Controller
{
    public function store(StoreConsultationRequest $request, ConsultationNumberService $numService)
    {
        $user = $request->user();
        if (!in_array($user->role, ['doctor','doctor-manager','admin'], true)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $data = $request->validated();

        $consultation = DB::transaction(function () use ($data, $user, $numService) {

            if (!empty($data['appointment_id'])) {
                /** @var Appointment $appt */
                $appt = Appointment::lockForUpdate()->findOrFail($data['appointment_id']);

                if ((int)$appt->patient_id !== (int)$data['patient_id']) {
                    throw ValidationException::withMessages(['appointment_id' => 'Appointment patient mismatch']);
                }
                if ((int)$appt->doctor_id !== (int)$user->id && !in_array($user->role, ['admin','doctor-manager'], true)) {
                    throw ValidationException::withMessages(['appointment_id' => 'Appointment not owned by doctor']);
                }
            }

            return Consultation::create([
                'consultation_number' => $numService->generate(),
                'patient_id' => $data['patient_id'],
                'doctor_id' => in_array($user->role, ['admin','doctor-manager'], true)
                    ? ($data['doctor_id'] ?? $user->id)
                    : $user->id,
                'appointment_id' => $data['appointment_id'] ?? null,
                'chief_complaint' => $data['chief_complaint'] ?? null,
                'symptoms' => $data['symptoms'] ?? null,
                'diagnosis' => $data['diagnosis'] ?? null,
                'notes' => $data['notes'] ?? null,
                'price_cents' => null,
                'payment_status' => 'unpaid',
            ]);
        });

        $consultation->load(['patient','doctor']);

        return (new ConsultationResource($consultation))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Consultation $consultation)
    {
        $consultation->load(['patient','doctor','payments','radiologyImages','nurseInstructions']);

        return new ConsultationResource($consultation);
    }

    public function update(StoreConsultationRequest $request, Consultation $consultation)
    {
        $user = $request->user();
        if ($user->role === 'doctor' && (int)$consultation->doctor_id !== (int)$user->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $data = $request->validated();
        unset($data['patient_id'], $data['appointment_id']);

        $consultation->update($data);

        return new ConsultationResource($consultation->fresh()->load(['patient','doctor']));
    }

    public function setPrice(SetPriceRequest $request, Consultation $consultation)
    {
        $user = $request->user();
        if ($user->role === 'doctor' && (int)$consultation->doctor_id !== (int)$user->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $consultation->update([
            'price_cents' => (int) $request->price_cents,
        ]);

        $totalPaid = (int) $consultation->payments()->sum('amount_cents');
        $price = (int) $consultation->price_cents;

        $status = 'unpaid';
        if ($price <= 0) {
            $status = 'paid';
        } elseif ($totalPaid > 0 && $totalPaid < $price) {
            $status = 'partial';
        } elseif ($totalPaid >= $price) {
            $status = 'paid';
        }

        $consultation->update(['payment_status' => $status]);


        return new ConsultationResource($consultation->fresh()->load(['patient','doctor']));
    }

    /**
     * Full endpoint for React dashboard (1 call returns everything)
     */
    public function showFull(Consultation $consultation)
    {
        $user = request()->user();

        if (!in_array($user->role, ['admin','doctor','doctor-manager','receptionist'], true)) {
            abort(403);
        }

        if ($user->role === 'doctor' && (int)$consultation->doctor_id !== (int)$user->id) {
            abort(403);
        }

        $consultation->load([
    'patient',
    'doctor',
    'payments.receptionist',
    'radiologyImages',
    'prescription.items',
    'medicalCertificate',
    'testRequest.items',

    // nurse instructions + relations (مطابقة للموديل)
    'nurseInstructions.createdByDoctor',
    'nurseInstructions.assignedToNurse',
    'nurseInstructions.completedByNurse',
]);



        return new ConsultationResource($consultation);
    }

    public function historyByPatient(Patient $patient)
    {
        $user = request()->user();

        if (!in_array($user->role, ['admin','doctor','doctor-manager'], true)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $excludeId = (int) request()->query('exclude_consultation_id');

        $query = Consultation::where('patient_id', $patient->id)
            ->orderByDesc('created_at');

        if ($excludeId > 0) {
            $query->where('id', '!=', $excludeId);
        }

        $consultations = $query->with([
            'doctor',
            'prescription.items',
            'medicalCertificate',
            'testRequest.items',
            'nurseInstructions.createdByDoctor',
            'nurseInstructions.assignedToNurse',
            'nurseInstructions.completedByNurse',
        ])->get();

        return ConsultationResource::collection($consultations);
    }
}
