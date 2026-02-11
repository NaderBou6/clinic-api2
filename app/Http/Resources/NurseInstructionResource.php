<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NurseInstructionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'patient_id' => $this->patient_id,
            'consultation_id' => $this->consultation_id,

            'instruction' => $this->instruction,
            'status' => $this->status,

            'patient' => new PatientResource($this->whenLoaded('patient')),

            'created_by_doctor' => new UserResource($this->whenLoaded('createdByDoctor')),
            'assigned_to_nurse' => new UserResource($this->whenLoaded('assignedToNurse')),
            'completed_by_nurse' => new UserResource($this->whenLoaded('completedByNurse')),

            'completed_at' => $this->completed_at,

            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
