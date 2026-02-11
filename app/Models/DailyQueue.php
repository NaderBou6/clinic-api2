<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DailyQueue extends Model
{
    protected $fillable = ['queue_date', 'current_number'];

    protected $casts = [
        'queue_date' => 'date',
        'current_number' => 'integer',
    ];

    public function entries()
    {
        return $this->hasMany(QueueEntry::class);
    }
}
