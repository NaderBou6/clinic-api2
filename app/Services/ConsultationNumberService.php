<?php

namespace App\Services;

use App\Models\Consultation;
use Illuminate\Support\Facades\DB;

class ConsultationNumberService
{
    public function generate(): string
    {
        $year = now()->format('Y');

        return DB::transaction(function () use ($year) {
            $last = Consultation::where('consultation_number', 'like', "C-{$year}-%")
                ->lockForUpdate()
                ->orderByDesc('id')
                ->value('consultation_number');

            $nextNumber = 1;
            if ($last) {
                $parts = explode('-', $last);
                $nextNumber = ((int) end($parts)) + 1;
            }

            return sprintf("C-%s-%06d", $year, $nextNumber);
        });
    }
}
