<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Consultation;
use App\Models\MedicalCertificate;
use App\Models\NurseInstruction;
use App\Models\Patient;
use App\Models\Payment;
use App\Models\Prescription;
use App\Models\TestRequest;
use App\Models\TestRequestItem;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Http\Request;

class StatsController extends Controller
{
    public function doctor(Request $request)
    {
        $user = $request->user();
        if (!in_array($user->role, ['doctor','doctor-manager','admin'], true)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $period = $request->query('period', 'day'); // day|week|month|year|custom
        $start = $request->query('start');
        $end = $request->query('end');

        if ($period !== 'custom') {
            $now = now();
            if ($period === 'week') {
                $startAt = $now->copy()->startOfWeek();
                $endAt = $now->copy()->endOfWeek();
            } elseif ($period === 'month') {
                $startAt = $now->copy()->startOfMonth();
                $endAt = $now->copy()->endOfMonth();
            } elseif ($period === 'year') {
                $startAt = $now->copy()->startOfYear();
                $endAt = $now->copy()->endOfYear();
            } else {
                $startAt = $now->copy()->startOfDay();
                $endAt = $now->copy()->endOfDay();
            }
        } else {
            $startAt = $start ? Carbon::parse($start)->startOfDay() : now()->startOfDay();
            $endAt = $end ? Carbon::parse($end)->endOfDay() : now()->endOfDay();
        }

        $doctorId = $request->query('doctor_id');
        if ($user->role === 'doctor') {
            $doctorId = $user->id;
        }

        $consultationsQuery = Consultation::query()
            ->whereBetween('created_at', [$startAt, $endAt]);
        if ($doctorId) {
            $consultationsQuery->where('doctor_id', $doctorId);
        }

        $appointmentsQuery = Appointment::query()
            ->whereBetween('start_time', [$startAt, $endAt]);
        if ($doctorId) {
            $appointmentsQuery->where('doctor_id', $doctorId);
        }

        $paymentsQuery = Payment::query()
            ->whereBetween('received_at', [$startAt, $endAt]);
        if ($doctorId) {
            $paymentsQuery->whereHas('consultation', function ($q) use ($doctorId) {
                $q->where('doctor_id', $doctorId);
            });
        }

        $prescriptionsQuery = Prescription::query()
            ->whereBetween('created_at', [$startAt, $endAt]);
        if ($doctorId) {
            $prescriptionsQuery->whereHas('consultation', function ($q) use ($doctorId) {
                $q->where('doctor_id', $doctorId);
            });
        }

        $certificatesQuery = MedicalCertificate::query()
            ->whereBetween('created_at', [$startAt, $endAt]);
        if ($doctorId) {
            $certificatesQuery->whereHas('consultation', function ($q) use ($doctorId) {
                $q->where('doctor_id', $doctorId);
            });
        }

        $testsQuery = TestRequest::query()
            ->whereBetween('created_at', [$startAt, $endAt]);
        if ($doctorId) {
            $testsQuery->whereHas('consultation', function ($q) use ($doctorId) {
                $q->where('doctor_id', $doctorId);
            });
        }

        $testItemsQuery = TestRequestItem::query()
            ->where('status', 'requested')
            ->whereHas('testRequest', function ($q) use ($startAt, $endAt, $doctorId) {
                $q->whereBetween('created_at', [$startAt, $endAt]);
                if ($doctorId) {
                    $q->whereHas('consultation', function ($qq) use ($doctorId) {
                        $qq->where('doctor_id', $doctorId);
                    });
                }
            });

        $instructionsQuery = NurseInstruction::query()
            ->whereBetween('created_at', [$startAt, $endAt]);
        if ($doctorId) {
            $instructionsQuery->where('created_by_doctor_id', $doctorId);
        }

        $consultationsCount = (clone $consultationsQuery)->count();
        $patientsUnique = (clone $consultationsQuery)->distinct('patient_id')->count('patient_id');
        $patientsNew = Patient::whereBetween('created_at', [$startAt, $endAt])->count();

        $appointmentsCount = (clone $appointmentsQuery)->count();
        $appointmentsByStatus = (clone $appointmentsQuery)
            ->selectRaw('status, COUNT(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $paymentsCount = (clone $paymentsQuery)->count();
        $paymentsTotal = (clone $paymentsQuery)->sum('amount_cents');
        $billedTotal = (clone $consultationsQuery)
            ->where('price_cents', '>', 0)
            ->sum('price_cents');

        $unpaidRows = (clone $consultationsQuery)
            ->whereIn('payment_status', ['unpaid','partial'])
            ->where('price_cents', '>', 0)
            ->withSum('payments', 'amount_cents')
            ->get(['id','price_cents']);

        $unpaidCount = $unpaidRows->count();
        $unpaidRemaining = $unpaidRows->sum(function ($row) {
            $paid = (int) ($row->payments_sum_amount_cents ?? 0);
            $price = (int) ($row->price_cents ?? 0);
            return max(0, $price - $paid);
        });

        $seriesUnit = $period === 'year' ? 'month' : 'day';
        $labelFormat = $seriesUnit === 'month' ? 'Y-m' : 'Y-m-d';
        $periodRange = CarbonPeriod::create(
            $startAt->copy()->startOf($seriesUnit),
            "1 {$seriesUnit}",
            $endAt->copy()->startOf($seriesUnit)
        );

        $labels = [];
        foreach ($periodRange as $dt) {
            $labels[] = $dt->format($labelFormat);
        }

        $dateExpr = $seriesUnit === 'month'
            ? "DATE_FORMAT(created_at, '%Y-%m')"
            : "DATE(created_at)";
        $paymentDateExpr = $seriesUnit === 'month'
            ? "DATE_FORMAT(received_at, '%Y-%m')"
            : "DATE(received_at)";

        $patientsSeriesQuery = Consultation::query()
            ->whereBetween('created_at', [$startAt, $endAt]);
        if ($doctorId) {
            $patientsSeriesQuery->where('doctor_id', $doctorId);
        }
        $patientsSeriesRows = $patientsSeriesQuery
            ->selectRaw("$dateExpr as label, COUNT(DISTINCT patient_id) as total")
            ->groupBy('label')
            ->pluck('total', 'label');

        $paymentsSeriesRows = Payment::query()
            ->whereBetween('received_at', [$startAt, $endAt]);
        if ($doctorId) {
            $paymentsSeriesRows->whereHas('consultation', function ($q) use ($doctorId) {
                $q->where('doctor_id', $doctorId);
            });
        }
        $paymentsSeriesRows = $paymentsSeriesRows
            ->selectRaw("$paymentDateExpr as label, SUM(amount_cents) as total")
            ->groupBy('label')
            ->pluck('total', 'label');

        $patientsSeries = [];
        $paymentsSeries = [];
        foreach ($labels as $label) {
            $patientsSeries[] = (int) ($patientsSeriesRows[$label] ?? 0);
            $paymentsSeries[] = (int) ($paymentsSeriesRows[$label] ?? 0);
        }

        return response()->json([
            'range' => [
                'period' => $period,
                'start' => $startAt->toDateString(),
                'end' => $endAt->toDateString(),
            ],
            'doctor_id' => $doctorId ? (int) $doctorId : null,
            'metrics' => [
                'patients_new' => $patientsNew,
                'patients_unique' => $patientsUnique,
                'consultations_count' => $consultationsCount,
                'appointments_count' => $appointmentsCount,
                'appointments_by_status' => [
                    'scheduled' => (int) ($appointmentsByStatus['scheduled'] ?? 0),
                    'completed' => (int) ($appointmentsByStatus['completed'] ?? 0),
                    'cancelled' => (int) ($appointmentsByStatus['cancelled'] ?? 0),
                    'no_show' => (int) ($appointmentsByStatus['no_show'] ?? 0),
                ],
                'payments_count' => $paymentsCount,
                'payments_total_cents' => (int) $paymentsTotal,
                'billed_total_cents' => (int) $billedTotal,
                'unpaid_consultations' => $unpaidCount,
                'unpaid_remaining_cents' => (int) $unpaidRemaining,
                'prescriptions_count' => (clone $prescriptionsQuery)->count(),
                'certificates_count' => (clone $certificatesQuery)->count(),
                'test_requests_count' => (clone $testsQuery)->count(),
                'test_items_requested' => (clone $testItemsQuery)->count(),
                'nurse_instructions_count' => (clone $instructionsQuery)->count(),
            ],
            'series' => [
                'unit' => $seriesUnit,
                'labels' => $labels,
                'payments_cents' => $paymentsSeries,
                'patients_count' => $patientsSeries,
            ],
        ]);
    }
}
