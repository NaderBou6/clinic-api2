<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $fillable = [
        'name', 'email', 'password', 'role', 'is_active',
    ];

    protected $hidden = [
        'password', 'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    // Doctor relations
    public function doctorAppointments()
    {
        return $this->hasMany(Appointment::class, 'doctor_id');
    }

    public function doctorConsultations()
    {
        return $this->hasMany(Consultation::class, 'doctor_id');
    }

    public function createdNurseInstructions()
    {
        return $this->hasMany(NurseInstruction::class, 'created_by_doctor_id');
    }

    // Receptionist relations
    public function receivedPayments()
    {
        return $this->hasMany(Payment::class, 'received_by');
    }

    // Nurse relations
    public function assignedInstructions()
    {
        return $this->hasMany(NurseInstruction::class, 'assigned_to_nurse_id');
    }

    public function completedInstructions()
    {
        return $this->hasMany(NurseInstruction::class, 'completed_by_nurse_id');
    }

    // Radiology uploads
    public function uploadedRadiologyImages()
    {
        return $this->hasMany(RadiologyImage::class, 'uploaded_by');
    }
}
