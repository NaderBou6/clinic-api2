<?php

namespace App\Http\Requests\Prescriptions;

use Illuminate\Foundation\Http\FormRequest;

class StorePrescriptionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'items' => ['required','array','min:1'],
            'items.*.drug_name' => ['required','string','max:255'],
            'items.*.dosage' => ['nullable','string','max:100'],
            'items.*.frequency' => ['nullable','string','max:100'],
            'items.*.duration' => ['nullable','string','max:100'],
            'items.*.notes' => ['nullable','string','max:255'],
        ];
    }
}
