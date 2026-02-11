<?php

use Inertia\Inertia;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return Inertia::render('Login');
});
Route::get('/login', fn() => Inertia::render('Auth/Login'))->name('login');
Route::get('/nurse', fn() => Inertia::render('Nurse/Dashboard'));
Route::get('/receptionist', fn() => Inertia::render('Receptionist/Dashboard'));
Route::get('/receptionist/WaitingRoom', fn() => Inertia::render('Receptionist/WaitingRoom'));
Route::get('/doctor', fn() => Inertia::render('Doctor/Dashboard'));
Route::get('/admin', fn() => Inertia::render('Admin/Dashboard'));
Route::get('/receptionist/patients', fn() => Inertia::render('Receptionist/Patients'));
Route::get('/self-registration', fn() => Inertia::render('Public/RemoteRegistration'));
