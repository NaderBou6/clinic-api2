<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $search = trim((string)$request->query('search',''));
        $q = User::query()->orderByDesc('id');

        if ($search !== '') {
            $q->where(function ($qq) use ($search) {
                $qq->where('name','like',"%{$search}%")
                   ->orWhere('email','like',"%{$search}%")
                   ->orWhere('role','like',"%{$search}%");
            });
        }

        return $q->paginate(15);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required','string','max:120'],
            'email' => ['required','email','max:190','unique:users,email'],
            'password' => ['required','string','min:6'],
            'role' => ['required','in:admin,doctor,doctor-manager,receptionist,receptionist-nurse,nurse'],
            'is_active' => ['nullable','boolean'],
        ]);

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'role' => $data['role'],
            'is_active' => $data['is_active'] ?? true,
        ]);

        return response()->json($user, 201);
    }

    public function show(User $user) { return response()->json($user); }

    public function update(Request $request, User $user)
    {
        $data = $request->validate([
            'name' => ['sometimes','required','string','max:120'],
            'email' => ['sometimes','required','email','max:190',"unique:users,email,{$user->id}"],
            'password' => ['nullable','string','min:6'],
            'role' => ['sometimes','required','in:admin,doctor,doctor-manager,receptionist,receptionist-nurse,nurse'],
            'is_active' => ['nullable','boolean'],
        ]);

        if (array_key_exists('password', $data) && $data['password']) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        $user->update($data);
        return response()->json($user->fresh());
    }

    public function destroy(User $user)
    {
        $user->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
