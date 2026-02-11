<?php

namespace App\Http\Requests\Tests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'items' => ['required','array','min:1'],
            'items.*.test_name' => ['required','string','max:255'],
            'items.*.notes' => ['nullable','string','max:255'],
            'items.*.status' => ['nullable','in:requested,done'],
        ];
    }
}
