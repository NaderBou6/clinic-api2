<?php

namespace App\Http\Requests\Instructions;

use Illuminate\Foundation\Http\FormRequest;

class StoreInstructionRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'consultation_id' => ['nullable','exists:consultations,id'],
            'assigned_to_nurse_id' => ['nullable','exists:users,id'],
            'instruction' => ['required','string','min:3'],
        ];
    }
}
