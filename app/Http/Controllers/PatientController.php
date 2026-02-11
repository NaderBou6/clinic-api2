<?php

namespace App\Http\Controllers;

use App\Http\Requests\Patients\StorePatientRequest;
use App\Http\Requests\Patients\UpdatePatientRequest;
use App\Http\Resources\PatientResource;
use App\Models\Patient;
use App\Services\PatientCodeService;
use Illuminate\Http\Request;
use Carbon\Carbon;

class PatientController extends Controller
{
public function index(Request $request)
{
    $q = Patient::query();

    $search = trim((string) $request->query('search', ''));
    if ($search !== '' && mb_strlen($search) >= 2) {
        $q->where(function ($qq) use ($search) {
            $qq->where('patient_code', 'like', "%{$search}%")
               ->orWhere('phone', 'like', "%{$search}%")
               ->orWhere('first_name', 'like', "%{$search}%")
               ->orWhere('last_name', 'like', "%{$search}%");
        });
    }

    $first = trim((string) $request->query('first_name', ''));
    if ($first !== '' && mb_strlen($first) >= 2) {
        $q->where('first_name', 'like', "%{$first}%");
    }

    $last = trim((string) $request->query('last_name', ''));
    if ($last !== '' && mb_strlen($last) >= 2) {
        $q->where('last_name', 'like', "%{$last}%");
    }

    $phone = trim((string) $request->query('phone', ''));
    if ($phone !== '' && mb_strlen($phone) >= 2) {
        $q->where('phone', 'like', "%{$phone}%");
    }

    $gender = $request->query('gender');
    if (in_array($gender, ['male','female'], true)) {
        $q->where('gender', $gender);
    }

    $placeOfBirth = trim((string) $request->query('place_of_birth', ''));
    if ($placeOfBirth !== '' && mb_strlen($placeOfBirth) >= 2) {
        $q->where('place_of_birth', 'like', "%{$placeOfBirth}%");
    }

    $address = trim((string) $request->query('address', ''));
    if ($address !== '' && mb_strlen($address) >= 2) {
        $q->where('address', 'like', "%{$address}%");
    }

    $dobExact = $request->query('dob_exact');
    if ($dobExact) $q->whereDate('dob', $dobExact);

    $dobFrom = $request->query('dob_from');
    if ($dobFrom) $q->whereDate('dob', '>=', $dobFrom);

    $dobTo = $request->query('dob_to');
    if ($dobTo) $q->whereDate('dob', '<=', $dobTo);

    $createdFrom = $request->query('created_from');
    if ($createdFrom) $q->whereDate('created_at', '>=', $createdFrom);

    $createdTo = $request->query('created_to');
    if ($createdTo) $q->whereDate('created_at', '<=', $createdTo);

    $ageExact = $request->query('age_exact');
    if ($ageExact !== null && $ageExact !== '') {
        $minDob = Carbon::today()->subYears((int) $ageExact + 1)->addDay();
        $maxDob = Carbon::today()->subYears((int) $ageExact);
        $q->whereBetween('dob', [$minDob->toDateString(), $maxDob->toDateString()]);
    }

    $ageMin = $request->query('age_min');
    if ($ageMin !== null && $ageMin !== '') {
        $maxDob = Carbon::today()->subYears((int) $ageMin);
        $q->whereDate('dob', '<=', $maxDob->toDateString());
    }

    $ageMax = $request->query('age_max');
    if ($ageMax !== null && $ageMax !== '') {
        $minDob = Carbon::today()->subYears((int) $ageMax + 1)->addDay();
        $q->whereDate('dob', '>=', $minDob->toDateString());
    }

    $sortBy = $request->query('sort_by', 'id');
    $sortDir = strtolower((string) $request->query('sort_dir', 'desc')) === 'asc' ? 'asc' : 'desc';

    if ($sortBy === 'age') {
        $dir = $sortDir === 'asc' ? 'desc' : 'asc';
        $q->orderBy('dob', $dir);
    } elseif (in_array($sortBy, ['id','first_name','last_name','created_at','dob'], true)) {
        $q->orderBy($sortBy, $sortDir);
    } else {
        $q->orderByDesc('id');
    }

    $perPage = (int) $request->query('per_page', 10);
    $perPage = max(1, min($perPage, 50));

    return $q->paginate($perPage);
}


    public function store(StorePatientRequest $request, PatientCodeService $codeService)
    {
        $patient = Patient::create(array_merge(
            $request->validated(),
            ['patient_code' => $codeService->generate()]
        ));

        return (new PatientResource($patient))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdatePatientRequest $request, Patient $patient)
    {
        $patient->update($request->validated());
        return (new PatientResource($patient))
            ->response()
            ->setStatusCode(201);
    }

    public function destroy(Patient $patient)
    {
        $patient->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
