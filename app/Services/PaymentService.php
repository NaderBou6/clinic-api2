<?php

namespace App\Services;

use App\Models\Consultation;
use App\Models\Payment;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PaymentService
{
    public function addPayment(Consultation $consultation, array $data, int $receivedByUserId): Payment
    {
        return DB::transaction(function () use ($consultation, $data, $receivedByUserId) {

            // Reload consultation with lock to avoid race conditions
            $consultation = Consultation::lockForUpdate()->findOrFail($consultation->id);

            if ((int)$consultation->price_cents <= 0) {
                throw ValidationException::withMessages([
                    'price_cents' => 'Consultation price must be set before taking payments.',
                ]);
            }

            $alreadyPaid = (int) $consultation->payments()->sum('amount_cents');
            $remaining = (int) $consultation->price_cents - $alreadyPaid;

            if ((int)$data['amount_cents'] > $remaining) {
                throw ValidationException::withMessages([
                    'amount_cents' => 'Payment exceeds remaining balance.',
                ]);
            }

            $payment = $consultation->payments()->create([
                'amount_cents' => (int) $data['amount_cents'],
                'method' => $data['method'],
                'reference' => $data['reference'] ?? null,
                'received_by' => $receivedByUserId,
                'received_at' => now(),
                'notes' => $data['notes'] ?? null,
            ]);

            // Update consultation payment_status
            $newTotalPaid = $alreadyPaid + (int) $data['amount_cents'];

            $status = 'unpaid';
            if ($newTotalPaid <= 0) {
                $status = 'unpaid';
            } elseif ($newTotalPaid < (int)$consultation->price_cents) {
                $status = 'partial';
            } else {
                $status = 'paid';
            }

            $consultation->update(['payment_status' => $status]);

            return $payment->load('receptionist');
        });
    }

    public function summary(Consultation $consultation): array
    {
        $totalPaid = (int) $consultation->payments()->sum('amount_cents');
        $price = (int) $consultation->price_cents;

        return [
            'price_cents' => $price,
            'total_paid_cents' => $totalPaid,
            'remaining_cents' => max(0, $price - $totalPaid),
            'payment_status' => $consultation->payment_status,
        ];
    }
}
