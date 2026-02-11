<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ConsultationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'consultation_number' => $this->consultation_number,
            'patient_id' => $this->patient_id,
            'doctor_id' => $this->doctor_id,
            'appointment_id' => $this->appointment_id,
            'queue_entry_id' => $this->queue_entry_id,

            'chief_complaint' => $this->chief_complaint,
            'symptoms' => $this->symptoms,
            'diagnosis' => $this->diagnosis,
            'notes' => $this->notes,

            'price_cents' => $this->price_cents,
            'payment_status' => $this->payment_status,

            'patient' => new PatientResource($this->whenLoaded('patient')),
            'doctor' => new UserResource($this->whenLoaded('doctor')),

            'payments' => PaymentResource::collection($this->whenLoaded('payments')),
            'radiology_images' => RadiologyImageResource::collection($this->whenLoaded('radiologyImages')),
            // medical part
            'prescription' => new PrescriptionResource($this->whenLoaded('prescription')),
            'medical_certificate' => new MedicalCertificateResource($this->whenLoaded('medicalCertificate')),
            'test_request' => new TestRequestResource($this->whenLoaded('testRequest')),

            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,


            'nurse_instructions' => NurseInstructionResource::collection($this->whenLoaded('nurseInstructions')),

        ];
    }
}
