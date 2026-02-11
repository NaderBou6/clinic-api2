<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class QueueEntryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'daily_queue_id' => $this->daily_queue_id,
            'patient_id' => $this->patient_id,
            'number' => $this->number,
            'priority' => $this->priority,
            'status' => $this->status,
            'patient' => new PatientResource($this->whenLoaded('patient')),
            'consultation' => $this->whenLoaded('consultation', function () {
                if (!$this->consultation) {
                    return null;
                }

                return [
                    'id' => $this->consultation->id,
                    'price_cents' => $this->consultation->price_cents,
                    'payment_status' => $this->consultation->payment_status,
                ];
            }),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
