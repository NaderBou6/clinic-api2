<?php

namespace App\Http\Requests\Appointments;

use Illuminate\Foundation\Http\FormRequest;

class StoreAppointmentRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'patient_id' => ['required','exists:patients,id'],
            'doctor_id' => ['required','exists:users,id'],
            'start_time' => ['required','date'],
            'end_time' => ['required','date','after:start_time'],
            'status' => ['nullable','in:scheduled,completed,cancelled,no_show'],
            'notes' => ['nullable','string'],
        ];
    }
}
