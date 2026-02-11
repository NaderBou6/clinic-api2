<?php

namespace Database\Seeders;

use App\Models\Patient;
use App\Models\QueueEntry;
use App\Models\User;
use Illuminate\Database\Seeder;

class QueueDemoSeeder extends Seeder
{
    public function run(): void
    {
        $receptionist = User::whereIn('role', ['receptionist','admin'])->first();
        if (!$receptionist) {
            $this->command->warn("No receptionist/admin user found. Seed users first.");
            return;
        }

        // Create demo patients (if not exist by phone)
        $patients = [
            ['patient_code'=>'P-2026-000201','first_name'=>'Ali','last_name'=>'Benali','phone'=>'0551000201','dob'=>'2000-01-15','gender'=>'male','address'=>'Alger'],
            ['patient_code'=>'P-2026-000202','first_name'=>'Sara','last_name'=>'Kaci','phone'=>'0551000202','dob'=>'1995-05-20','gender'=>'female','address'=>'Oran'],
            ['patient_code'=>'P-2026-000203','first_name'=>'Yacine','last_name'=>'Brahmi','phone'=>'0551000203','dob'=>'1988-11-03','gender'=>'male','address'=>'Blida'],
            ['patient_code'=>'P-2026-000204','first_name'=>'Nadia','last_name'=>'Cherif','phone'=>'0551000204','dob'=>'2005-03-09','gender'=>'female','address'=>'Setif'],
            ['patient_code'=>'P-2026-000205','first_name'=>'Mohamed','last_name'=>'Ziani','phone'=>'0551000205','dob'=>'1979-07-22','gender'=>'male','address'=>'Tizi Ouzou'],
        ];

        $created = [];
        foreach ($patients as $p) {
            $created[] = Patient::updateOrCreate(
                ['phone' => $p['phone']],
                array_merge($p, ['created_at'=>now(), 'updated_at'=>now()])
            );
        }

        $date = now()->toDateString();

        // Delete today queue entries then re-add (demo)
        QueueEntry::whereDate('queue_date', $date)->delete();

        $statuses = ['done','in_treatment','waiting','waiting','waiting'];

        foreach ($created as $i => $pat) {
            $num = $i + 1;
            $status = $statuses[$i];

            QueueEntry::create([
                'queue_date' => $date,
                'patient_id' => $pat->id,
                'queue_number' => $num,
                'status' => $status,
                'started_at' => $status === 'in_treatment' ? now()->subMinutes(20) : null,
                'done_at' => $status === 'done' ? now()->subMinutes(40) : null,
                'created_by' => $receptionist->id,
            ]);
        }
    }
}
