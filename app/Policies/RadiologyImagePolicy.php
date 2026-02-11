<?php

namespace App\Policies;

use App\Models\RadiologyImage;
use App\Models\User;

class RadiologyImagePolicy
{
    public function download(User $user, RadiologyImage $radiologyImage): bool
    {
        if (!$user->is_active) {
            return false;
        }

        if (in_array($user->role, ['admin', 'receptionist'], true)) {
            return true;
        }

        if ($user->role === 'doctor') {
            $radiologyImage->loadMissing('consultation');
            return (int) $radiologyImage->consultation->doctor_id === (int) $user->id;
        }

        return false; // nurse or others
    }
}
