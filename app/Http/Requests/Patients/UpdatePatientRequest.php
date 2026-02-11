<?php

namespace App\Http\Requests\Patients;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePatientRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        $patientId = $this->route('patient')?->id;

        return [
            'first_name' => ['sometimes','required','string','max:120'],
            'last_name' => ['sometimes','required','string','max:120'],
            'phone' => ['sometimes','required','string','max:40',"unique:patients,phone,{$patientId}"],
            'dob' => ['nullable','date'],
            'gender' => ['nullable','in:male,female'],
            'address' => ['nullable','string','max:255'],
            'medical_history_summary' => ['nullable','string'],
        ];
    }
}
