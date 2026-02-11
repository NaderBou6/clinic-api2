<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    protected $fillable = [
        'consultation_id',
        'amount_cents',
        'method',
        'reference',
        'received_by',
        'received_at',
        'notes',
    ];

    protected $casts = [
        'amount_cents' => 'integer',
        'received_at' => 'datetime',
    ];

    public function consultation()
    {
        return $this->belongsTo(Consultation::class);
    }

    public function receptionist()
    {
        return $this->belongsTo(User::class, 'received_by');
    }
}
