<?php

namespace App\Http\Controllers;

use App\Http\Requests\Certificates\StoreMedicalCertificateRequest;
use App\Http\Resources\MedicalCertificateResource;
use App\Models\Consultation;
use Illuminate\Support\Facades\DB;

class MedicalCertificateController extends Controller
{
    public function show(Consultation $consultation)
    {
        $this->authorizeDoctor($consultation);

        $certificate = $consultation->medicalCertificate;

        // إذا ما كاينش شهادة نرجع 204
        if (!$certificate) {
            return response()->noContent();
        }

        return new MedicalCertificateResource($certificate);
    }

    public function store(StoreMedicalCertificateRequest $request, Consultation $consultation)
    {
        $this->authorizeDoctor($consultation);

        if ($consultation->medicalCertificate) {
            return response()->json(['message' => 'Medical certificate already exists'], 409);
        }

        $certificate = $consultation->medicalCertificate()->create($request->validated());

        return (new MedicalCertificateResource($certificate))
            ->response()
            ->setStatusCode(201);
    }

    public function update(StoreMedicalCertificateRequest $request, Consultation $consultation)
    {
        $this->authorizeDoctor($consultation);

        $certificate = $consultation->medicalCertificate;

        if (!$certificate) {
            return response()->json(['message' => 'Medical certificate not found'], 404);
        }

        $certificate->update($request->validated());

        return new MedicalCertificateResource($certificate);
    }

    private function authorizeDoctor(Consultation $consultation): void
    {
        $user = request()->user();

        if (!in_array($user->role, ['doctor','doctor-manager','admin'], true)) {
            abort(403);
        }

        if ($user->role === 'doctor' && (int)$consultation->doctor_id !== (int)$user->id) {
            abort(403);
        }
    }
}
