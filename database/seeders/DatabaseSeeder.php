<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            ['name' => 'Admin', 'email' => 'admin@clinic.com', 'role' => 'admin'],
            ['name' => 'Dr Ahmed', 'email' => 'doctor@clinic.com', 'role' => 'doctor'],
            ['name' => 'Reception', 'email' => 'reception@clinic.com', 'role' => 'receptionist'],
            ['name' => 'Reception Nurse', 'email' => 'reception-nurse@clinic.com', 'role' => 'receptionist-nurse'],
            ['name' => 'Nurse Sara', 'email' => 'nurse@clinic.com', 'role' => 'nurse'],
        ];

        foreach ($users as $u) {
            User::updateOrCreate(
                ['email' => $u['email']],
                [
                    'name' => $u['name'],
                    'role' => $u['role'],
                    'is_active' => true,
                    'password' => Hash::make('secret123'),
                ]
            );
        }
    }
}
