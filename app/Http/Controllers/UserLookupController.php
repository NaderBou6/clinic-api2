<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class UserLookupController extends Controller
{
    public function nurses(Request $request)
    {
        $user = $request->user();
        if (!in_array($user->role, ['admin','receptionist','receptionist-nurse','doctor','doctor-manager'], true)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $rows = User::query()
            ->select(['id','name','email','role'])
            ->where('is_active', true)
            ->whereIn('role', ['nurse','receptionist-nurse'])
            ->orderBy('name')
            ->get();

        return response()->json(['data' => $rows]);
    }
}
