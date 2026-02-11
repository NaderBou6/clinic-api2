<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'consultation_id' => $this->consultation_id,

            'amount_cents' => (int) $this->amount_cents,
            'method' => $this->method,
            'reference' => $this->reference,

            'received_at' => $this->received_at,

            // receptionist info (object)
            'receptionist' => new UserResource(
                $this->whenLoaded('receptionist')
            ),

            'notes' => $this->notes,

            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
