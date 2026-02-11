<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TestRequestItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'test_request_id',
        'test_name',
        'notes',
        'status',
    ];

    public function testRequest()
    {
        return $this->belongsTo(TestRequest::class);
    }
}
