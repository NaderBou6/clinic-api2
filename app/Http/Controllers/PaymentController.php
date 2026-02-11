<?php

namespace App\Http\Controllers;

use App\Http\Requests\Payments\StorePaymentRequest;
use App\Http\Resources\PaymentResource;
use App\Models\Consultation;
use App\Services\PaymentService;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function index(Consultation $consultation)
    {
        $user = request()->user();
        if (!in_array($user->role, ['receptionist','admin','doctor','doctor-manager'], true)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        // doctor sees only own consultation
        if ($user->role === 'doctor' && (int)$consultation->doctor_id !== (int)$user->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $payments = $consultation->payments()
            ->with('receptionist')
            ->orderByDesc('received_at')
            ->paginate(20);

        return PaymentResource::collection($payments);
    }

    public function store(StorePaymentRequest $request, Consultation $consultation, PaymentService $service)
    {
        $user = $request->user();
        if (!in_array($user->role, ['receptionist','admin'], true)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $payment = $service->addPayment($consultation, $request->validated(), $user->id);

        return response()->json([
            'payment' => new PaymentResource($payment),
            'summary' => $service->summary($consultation),
        ], 201);
    }

    public function summary(Consultation $consultation, PaymentService $service)
    {
        $user = request()->user();
        if (!in_array($user->role, ['receptionist','admin','doctor','doctor-manager'], true)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if ($user->role === 'doctor' && (int)$consultation->doctor_id !== (int)$user->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return response()->json([
            'data' => $service->summary($consultation),
        ]);
    }
}
