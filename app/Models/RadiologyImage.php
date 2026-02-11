<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RadiologyImage extends Model
{
    protected $fillable = [
        'consultation_id',
        'uploaded_by',
        'original_name',
        'mime_type',
        'size_bytes',
        'storage_path',
        'description',
    ];

    protected $casts = [
        'size_bytes' => 'integer',
    ];

    public function consultation()
    {
        return $this->belongsTo(Consultation::class);
    }
    
    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
