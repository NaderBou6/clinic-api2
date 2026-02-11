<?php

namespace App\Http\Requests\Patients;

use Illuminate\Foundation\Http\FormRequest;

class StorePatientRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'first_name' => ['required','string','max:120'],
            'last_name' => ['required','string','max:120'],
            'phone' => ['required','string','max:40','unique:patients,phone'],
            'dob' => ['nullable','date'],
            'gender' => ['nullable','in:male,female'],
            'address' => ['nullable','string','max:255'],
            'medical_history_summary' => ['nullable','string'],
        ];
    }
}
