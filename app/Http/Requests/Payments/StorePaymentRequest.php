<?php

namespace App\Http\Requests\Payments;

use Illuminate\Foundation\Http\FormRequest;

class StorePaymentRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'amount_cents' => ['required','integer','min:1','max:200000000'],
            'method' => ['nullable','in:cash,card,transfer,other'],
            'reference' => ['nullable','string','max:120'],
            'notes' => ['nullable','string'],
        ];
    }
}
