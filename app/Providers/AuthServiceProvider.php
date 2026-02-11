<?php

namespace App\Providers;

use App\Models\RadiologyImage;
use App\Policies\RadiologyImagePolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    protected $policies = [
        RadiologyImage::class => RadiologyImagePolicy::class,
    ];

    public function boot(): void
    {
        //
    }
}
