<?php

namespace App\Http\Controllers;

use App\Models\Patient;
use Illuminate\Http\Request;

class PatientPaymentsController extends Controller
{
    public function unpaidConsultations(Request $request, Patient $patient)
    {
        $user = $request->user();
        if (!in_array($user->role, ['receptionist','admin'], true)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        // consultations غير المدفوعة أو partially
        $rows = $patient->consultations()
            ->withSum('payments', 'amount_cents')
            ->whereIn('payment_status', ['unpaid','partial'])
            ->orderByDesc('id')
            ->get(['id','consultation_number','price_cents','payment_status','created_at']);

        $rows = $rows->map(function ($row) {
            $paid = (int) ($row->payments_sum_amount_cents ?? 0);
            $price = (int) $row->price_cents;
            return [
                'id' => $row->id,
                'consultation_number' => $row->consultation_number,
                'price_cents' => $price,
                'payment_status' => $row->payment_status,
                'created_at' => $row->created_at,
                'total_paid_cents' => $paid,
                'remaining_cents' => max(0, $price - $paid),
            ];
        });

        return response()->json([
            'patient_id' => $patient->id,
            'rows' => $rows,
        ]);
    }
}
