<?php

namespace App\Http\Controllers;

use App\Http\Resources\RadiologyImageResource;
use App\Models\Consultation;
use App\Models\RadiologyImage;
use App\Services\RadiologyService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class RadiologyController extends Controller
{
    /**
     * Upload radiology file linked to a consultation
     * Allowed: admin OR doctor (only if owns the consultation)
     */
    public function upload(Request $request, Consultation $consultation, RadiologyService $service)
    {
        $user = $request->user();

        // Only admin or doctor can upload
        if (!in_array($user->role, ['doctor', 'admin'], true)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        // Doctor can upload only to his own consultation
        if ($user->role === 'doctor' && (int) $consultation->doctor_id !== (int) $user->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'file' => ['required', 'file', 'max:10240', 'mimes:jpg,jpeg,png,pdf'],
            'description' => ['nullable', 'string', 'max:255'],
        ]);

        $img = $service->store(
            $consultation->id,
            $user->id,
            $request->file('file'),
            $validated['description'] ?? null
        );

        return (new RadiologyImageResource($img))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Download radiology file
     * Authorization handled by RadiologyImagePolicy::download()
     */
    public function download(RadiologyImage $radiologyImage)
    {
        // Ensure relation is loaded (avoid lazy-loading issues)
        $radiologyImage->load('consultation');

        // Policy check
        $this->authorize('download', $radiologyImage);

        $disk = Storage::disk('private');

        if (!$disk->exists($radiologyImage->storage_path)) {
            throw ValidationException::withMessages(['file' => 'File not found']);
        }

        return $disk->download(
            $radiologyImage->storage_path,
            $radiologyImage->original_name
        );
    }
}
