<?php

namespace App\Http\Controllers;

use App\Models\Consultation;
use App\Models\QueueEntry;
use App\Services\ConsultationNumberService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class DoctorFlowController extends Controller
{
    // POST /api/doctor/queue/{entry}/start-consultation
    public function startConsultation(Request $request, QueueEntry $entry, ConsultationNumberService $numService)
    {
        $user = $request->user();
        if (!in_array($user->role, ['doctor','doctor-manager','admin'], true)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $entry->loadMissing('dailyQueue');
        if ($entry->dailyQueue?->queue_date?->toDateString() !== now()->toDateString()) {
            throw ValidationException::withMessages(['queue' => 'Not today entry']);
        }

        if ($entry->status === 'in_consultation') {
            $existing = Consultation::where('queue_entry_id', $entry->id)->first();
            if ($existing) {
                return response()->json($existing, 200);
            }
            return response()->json(['message' => 'Consultation already started'], 409);
        }

        if ($entry->status !== 'waiting') {
            return response()->json(['message' => 'This patient is not waiting'], 409);
        }

        return DB::transaction(function () use ($entry, $user, $numService) {

            // prevent duplicate active consultation for same queue entry
            $existing = Consultation::where('queue_entry_id', $entry->id)->first();
            if ($existing) {
                return response()->json($existing, 200);
            }

            $consultation = Consultation::create([
                'consultation_number' => $numService->generate(),
                'patient_id' => $entry->patient_id,
                'doctor_id' => $user->id,
                'appointment_id' => null,
                'chief_complaint' => null,
                'symptoms' => null,
                'diagnosis' => null,
                'notes' => null,
                'price_cents' => null,          // null = not set yet
                'payment_status' => 'unpaid',
                'queue_entry_id' => $entry->id, // IMPORTANT
            ]);

            $entry->update(['status' => 'in_consultation']);

            return response()->json($consultation, 201);
        });
    }

    // POST /api/doctor/consultations/{consultation}/set-price  { price_cents?, is_free? }
    public function setPrice(Request $request, Consultation $consultation)
    {
        $user = $request->user();
        if (!in_array($user->role, ['doctor','doctor-manager','admin'], true)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if ($user->role === 'doctor' && (int)$consultation->doctor_id !== (int)$user->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $data = $request->validate([
            'is_free' => ['required','boolean'],
            'price_cents' => ['nullable','integer','min:1'],
        ]);

        $isFree = (bool) $data['is_free'];
        $price = $isFree ? 0 : (int)($data['price_cents'] ?? 0);

        if (!$isFree && $price <= 0) {
            throw ValidationException::withMessages(['price_cents' => 'Price is required when not free']);
        }

        $consultation->update([
            'price_cents' => $price,
            'payment_status' => $price === 0 ? 'paid' : 'unpaid', // free => paid
        ]);

        return response()->json($consultation->fresh());
    }

    // POST /api/doctor/consultations/{consultation}/cancel
    public function cancelConsultation(Request $request, Consultation $consultation)
    {
        $user = $request->user();
        if (!in_array($user->role, ['doctor','doctor-manager','admin'], true)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if ($user->role === 'doctor' && (int)$consultation->doctor_id !== (int)$user->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return DB::transaction(function () use ($consultation) {

            $entryId = $consultation->queue_entry_id;

            $consultation->delete();

            if ($entryId) {
                QueueEntry::where('id', $entryId)->update(['status' => 'waiting']);
            }

            return response()->json(['message' => 'Cancelled']);
        });
    }
}
