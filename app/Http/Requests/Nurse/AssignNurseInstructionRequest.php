<?php

namespace App\Http\Requests\Nurse;

use Illuminate\Foundation\Http\FormRequest;

class AssignNurseInstructionRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'assigned_to_nurse_id' => ['required','integer','exists:users,id'],
        ];
    }
}
