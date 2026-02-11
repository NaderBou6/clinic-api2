<?php

namespace App\Services;

use App\Models\Patient;
use Illuminate\Support\Facades\DB;

class PatientCodeService
{
    public function generate(): string
    {
        $year = now()->format('Y');

        // Lock to avoid duplicates in concurrency
        return DB::transaction(function () use ($year) {
            $last = Patient::where('patient_code', 'like', "P-{$year}-%")
                ->lockForUpdate()
                ->orderByDesc('id')
                ->value('patient_code');

            $nextNumber = 1;
            if ($last) {
                $parts = explode('-', $last);
                $nextNumber = ((int) end($parts)) + 1;
            }

            return sprintf("P-%s-%06d", $year, $nextNumber);
        });
    }
}
