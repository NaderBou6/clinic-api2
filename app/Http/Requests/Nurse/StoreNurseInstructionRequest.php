<?php

namespace App\Http\Requests\Nurse;

use Illuminate\Foundation\Http\FormRequest;

class StoreNurseInstructionRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'consultation_id' => ['nullable','integer','exists:consultations,id'],
            'instruction' => ['required','string'],
            'assigned_to_nurse_id' => ['nullable','integer','exists:users,id'],
        ];
    }
}
