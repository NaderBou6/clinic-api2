<?php

namespace App\Services;

use App\Models\RadiologyImage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;

class RadiologyService
{
    public function store(int $consultationId, int $uploadedBy, UploadedFile $file, ?string $description): RadiologyImage
    {
        $safeName = Str::uuid()->toString() . '.' . $file->getClientOriginalExtension();
        $path = $file->storeAs("radiology/{$consultationId}", $safeName, 'private');

        return RadiologyImage::create([
            'consultation_id' => $consultationId,
            'uploaded_by' => $uploadedBy,
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getClientMimeType(),
            'size_bytes' => (int) $file->getSize(),
            'storage_path' => $path,
            'description' => $description,
        ]);
    }
}
