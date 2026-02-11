<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NurseInstruction extends Model
{
    protected $fillable = [
        'patient_id',
        'consultation_id',
        'created_by_doctor_id',
        'assigned_to_nurse_id',
        'instruction',
        'status',
        'completed_by_nurse_id',
        'completed_at',
    ];

    protected $casts = [
        'completed_at' => 'datetime',
    ];

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function consultation()
    {
        return $this->belongsTo(Consultation::class);
    }

    public function createdByDoctor()
    {
        return $this->belongsTo(User::class, 'created_by_doctor_id');
    }

    public function assignedToNurse()
    {
        return $this->belongsTo(User::class, 'assigned_to_nurse_id');
    }

    public function completedByNurse()
    {
        return $this->belongsTo(User::class, 'completed_by_nurse_id');
    }
}
