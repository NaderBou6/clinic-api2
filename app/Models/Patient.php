<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Patient extends Model
{
    protected $fillable = [
        'patient_code',
        'first_name',
        'last_name',
        'phone',
        'dob',
        'gender',
        'address',
        'medical_history_summary',
    ];

    protected $casts = [
        'dob' => 'date',
    ];

    public function appointments()
    {
        return $this->hasMany(Appointment::class);
    }

    public function consultations()
    {
        return $this->hasMany(Consultation::class);
    }

    public function nurseInstructions()
    {
        return $this->hasMany(NurseInstruction::class);
    }
}
