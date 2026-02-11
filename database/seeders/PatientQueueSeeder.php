<?php

namespace Database\Seeders;

use App\Models\Consultation;
use App\Models\DailyQueue;
use App\Models\Patient;
use App\Models\QueueEntry;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class PatientQueueSeeder extends Seeder
{
    public function run(): void
    {
        $faker = \Faker\Factory::create();
        $today = now()->toDateString();

        $doctor = User::firstOrCreate(
            ['email' => 'doctor.demo@clinic.local'],
            [
                'name' => 'Doctor Demo',
                'password' => Hash::make('password'),
                'role' => 'doctor',
                'is_active' => true,
            ]
        );

        $queue = DailyQueue::firstOrCreate(
            ['queue_date' => $today],
            ['current_number' => 0]
        );

        $patients = [];
        for ($i = 0; $i < 60; $i++) {
            $patients[] = Patient::create([
                'patient_code' => 'P-' . strtoupper(Str::random(6)),
                'first_name' => $faker->firstName(),
                'last_name' => $faker->lastName(),
                'phone' => '055' . $faker->unique()->numberBetween(1000000, 9999999),
                'dob' => $faker->dateTimeBetween('-70 years', '-18 years')->format('Y-m-d'),
                'gender' => $faker->randomElement(['male', 'female']),
                'address' => $faker->streetAddress(),
                'medical_history_summary' => $faker->boolean(30) ? $faker->sentence() : null,
            ]);
        }

        $entries = [];
        for ($n = 1; $n <= 25; $n++) {
            $status = 'waiting';
            if ($n <= 4) $status = 'consulted';
            if ($n === 5) $status = 'in_consultation';
            if ($n === 9 || $n === 14) $status = 'cancelled';

            $entries[] = QueueEntry::create([
                'daily_queue_id' => $queue->id,
                'patient_id' => $patients[$n - 1]->id,
                'number' => $n,
                'status' => $status,
            ]);
        }

        $queue->update(['current_number' => 5]);

        $currentEntry = $entries[4] ?? null;
        if ($currentEntry) {
            Consultation::firstOrCreate(
                ['queue_entry_id' => $currentEntry->id],
                [
                    'consultation_number' => 'C-DEMO-' . strtoupper(Str::random(6)),
                    'patient_id' => $currentEntry->patient_id,
                    'doctor_id' => $doctor->id,
                    'appointment_id' => null,
                    'chief_complaint' => null,
                    'symptoms' => null,
                    'diagnosis' => null,
                    'notes' => null,
                    'price_cents' => null,
                    'payment_status' => 'unpaid',
                ]
            );
        }
    }
}
