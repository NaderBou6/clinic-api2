<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RadiologyImageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'consultation_id' => $this->consultation_id,
            'uploaded_by' => $this->uploaded_by,
            'original_name' => $this->original_name,
            'mime_type' => $this->mime_type,
            'size_bytes' => $this->size_bytes,
            'description' => $this->description,
            // رابط التحميل من API
            'download_url' => url("/api/radiology/{$this->id}/download"),
            'created_at' => $this->created_at,
        ];
    }
}
