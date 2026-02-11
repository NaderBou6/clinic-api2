<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Consultation extends Model
{
    protected $fillable = [
        'consultation_number',
        'patient_id',
        'doctor_id',
        'appointment_id',
        'queue_entry_id',
        'chief_complaint',
        'symptoms',
        'diagnosis',
        'notes',
        'price_cents',
        'payment_status',
    ];

    protected $casts = [
        'price_cents' => 'integer',
    ];

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function doctor()
    {
        return $this->belongsTo(User::class, 'doctor_id');
    }

    public function appointment()
    {
        return $this->belongsTo(Appointment::class);
    }

    public function queueEntry()
    {
        return $this->belongsTo(QueueEntry::class);
    }

    // Billing
    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    // Radiology
    public function radiologyImages()
    {
        return $this->hasMany(RadiologyImage::class);
    }

    // Nurse instructions
    public function nurseInstructions()
    {
        return $this->hasMany(NurseInstruction::class);
    }

    // Medical documents
    public function prescription()
    {
        return $this->hasOne(Prescription::class);
    }

    public function medicalCertificate()
    {
        return $this->hasOne(MedicalCertificate::class);
    }

    public function testRequest()
    {
        return $this->hasOne(TestRequest::class);
    }
}
