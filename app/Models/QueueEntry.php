<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QueueEntry extends Model
{
    protected $fillable = [
        'daily_queue_id',
        'patient_id',
        'number',
        'priority',
        'status',
    ];

    protected $casts = [
        'number' => 'integer',
        'priority' => 'integer',
    ];

    public function dailyQueue()
    {
        return $this->belongsTo(DailyQueue::class);
    }

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function consultation()
    {
        return $this->hasOne(Consultation::class);
    }
}
