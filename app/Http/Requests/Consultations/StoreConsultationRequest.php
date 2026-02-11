<?php

namespace App\Http\Requests\Consultations;

use Illuminate\Foundation\Http\FormRequest;

class StoreConsultationRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'patient_id' => ['required','exists:patients,id'],
            'appointment_id' => ['nullable','exists:appointments,id'],
            'chief_complaint' => ['nullable','string','max:255'],
            'symptoms' => ['nullable','string'],
            'diagnosis' => ['nullable','string'],
            'notes' => ['nullable','string'],
        ];
    }
}
