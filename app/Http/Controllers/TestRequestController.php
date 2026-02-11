<?php

namespace App\Http\Controllers;

use App\Http\Requests\Tests\StoreTestRequest;
use App\Http\Resources\TestRequestResource;
use App\Models\Consultation;
use Illuminate\Support\Facades\DB;

class TestRequestController extends Controller
{
    public function show(Consultation $consultation)
    {
        $this->authorizeDoctor($consultation);

        $testRequest = $consultation->testRequest()->with('items')->first();

        return $testRequest
            ? new TestRequestResource($testRequest)
            : response()->json(null, 204);
    }

    public function store(StoreTestRequest $request, Consultation $consultation)
    {
        $this->authorizeDoctor($consultation);

        if ($consultation->testRequest) {
            return response()->json(['message' => 'Test request already exists'], 409);
        }

        $testRequest = DB::transaction(function () use ($request, $consultation) {
            $tr = $consultation->testRequest()->create();
            $tr->items()->createMany($request->items);
            return $tr->load('items');
        });

        return (new TestRequestResource($testRequest))
            ->response()
            ->setStatusCode(201);
    }

    public function update(StoreTestRequest $request, Consultation $consultation)
    {
        $this->authorizeDoctor($consultation);

        $testRequest = $consultation->testRequest;
        if (!$testRequest) {
            return response()->json(['message' => 'Test request not found'], 404);
        }

        $testRequest = DB::transaction(function () use ($request, $testRequest) {
            $testRequest->items()->delete();
            $testRequest->items()->createMany($request->items);
            return $testRequest->load('items');
        });

        return new TestRequestResource($testRequest);
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
