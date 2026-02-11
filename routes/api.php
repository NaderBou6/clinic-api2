<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\PatientController;
use App\Http\Controllers\AppointmentController;
use App\Http\Controllers\ConsultationController;
use App\Http\Controllers\DoctorFlowController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\PatientPaymentsController;
use App\Http\Controllers\RadiologyController;
use App\Http\Controllers\NurseInstructionController;
use App\Http\Controllers\PrescriptionController;
use App\Http\Controllers\MedicalCertificateController;
use App\Http\Controllers\TestRequestController;
use App\Http\Controllers\QueueController;
use App\Http\Controllers\DoctorController;
use App\Http\Controllers\StatsController;
use App\Http\Controllers\UserLookupController;
use App\Http\Controllers\PublicRegistrationController;

Route::post('/auth/login', [AuthController::class, 'login']);
Route::get('/public/queue/today', [QueueController::class, 'publicToday']);
Route::post('/public/self-registration', [PublicRegistrationController::class, 'store']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    Route::middleware('role:admin')->prefix('admin')->group(function () {
        Route::apiResource('users', AdminUserController::class);
    });

    // Patients
    Route::middleware('role:admin,receptionist,receptionist-nurse,doctor,doctor-manager')->group(function () {
        Route::get('/patients', [PatientController::class, 'index']);
        Route::get('/patients/{patient}', [PatientController::class, 'show']);
    });

    Route::middleware('role:admin,receptionist,receptionist-nurse')->group(function () {
        Route::post('/patients', [PatientController::class, 'store']);
        Route::put('/patients/{patient}', [PatientController::class, 'update']);
        Route::delete('/patients/{patient}', [PatientController::class, 'destroy']);
    });

    // Appointments
    Route::middleware('role:admin,receptionist,receptionist-nurse')->apiResource('appointments', AppointmentController::class);
    Route::middleware('role:admin,receptionist,receptionist-nurse,doctor-manager')->get('/doctors', [DoctorController::class, 'index']);

    // Consultations (general CRUD)
    Route::middleware('role:admin,doctor,doctor-manager')->group(function () {
        Route::post('/consultations', [ConsultationController::class, 'store']);
        Route::get('/consultations/{consultation}', [ConsultationController::class, 'show']);
        Route::put('/consultations/{consultation}', [ConsultationController::class, 'update']);
        Route::post('/consultations/{consultation}/set-price', [ConsultationController::class, 'setPrice']);
        Route::get('/consultations/{consultation}/full', [ConsultationController::class, 'showFull']);
        Route::get('/patients/{patient}/consultations', [ConsultationController::class, 'historyByPatient']);
    });

    // Doctor queue flow
    Route::prefix('doctor')->middleware('role:doctor,doctor-manager,admin')->group(function () {
        Route::post('/queue/{entry}/start-consultation', [DoctorFlowController::class, 'startConsultation']);
        Route::post('/consultations/{consultation}/set-price', [DoctorFlowController::class, 'setPrice']);
        Route::post('/consultations/{consultation}/cancel', [DoctorFlowController::class, 'cancelConsultation']);
    });

    // Queue
    Route::prefix('queue')->group(function () {
        Route::get('/today', [QueueController::class, 'today']);
        Route::post('/add', [QueueController::class, 'add']);
        Route::post('/next', [QueueController::class, 'next']);
        Route::post('/{entry}/cancel', [QueueController::class, 'cancel']);
        Route::post('/{entry}/priority', [QueueController::class, 'priority']);
    });

    // Payments
    Route::middleware('role:admin,doctor,doctor-manager,receptionist,receptionist-nurse')->group(function () {
        Route::get('/consultations/{consultation}/payments', [PaymentController::class, 'index']);
        Route::get('/consultations/{consultation}/payment-summary', [PaymentController::class, 'summary']);
    });

    Route::middleware('role:admin,receptionist,receptionist-nurse')->group(function () {
        Route::post('/consultations/{consultation}/payments', [PaymentController::class, 'store']);
        Route::get('/patients/{patient}/unpaid-consultations', [PatientPaymentsController::class, 'unpaidConsultations']);
    });

    // Prescriptions
    Route::middleware('role:doctor,doctor-manager,admin')->group(function () {
        Route::get('/consultations/{consultation}/prescription', [PrescriptionController::class, 'show']);
        Route::post('/consultations/{consultation}/prescription', [PrescriptionController::class, 'store']);
        Route::put('/consultations/{consultation}/prescription', [PrescriptionController::class, 'update']);
    });

    // Medical Certificates
    Route::middleware('role:doctor,doctor-manager,admin')->group(function () {
        Route::get('/consultations/{consultation}/medical-certificate', [MedicalCertificateController::class, 'show']);
        Route::post('/consultations/{consultation}/medical-certificate', [MedicalCertificateController::class, 'store']);
        Route::put('/consultations/{consultation}/medical-certificate', [MedicalCertificateController::class, 'update']);
    });

    // Test Requests
    Route::middleware('role:doctor,doctor-manager,admin')->group(function () {
        Route::get('/consultations/{consultation}/test-request', [TestRequestController::class, 'show']);
        Route::post('/consultations/{consultation}/test-request', [TestRequestController::class, 'store']);
        Route::put('/consultations/{consultation}/test-request', [TestRequestController::class, 'update']);
    });

    // Radiology Images
    Route::post('/consultations/{consultation}/radiology', [RadiologyController::class, 'upload']);
    Route::get('/radiology/{radiologyImage}/download', [RadiologyController::class, 'download']);

    // Nurse instructions
    Route::middleware('role:admin,doctor,doctor-manager')->post('/patients/{patient}/instructions', [NurseInstructionController::class, 'store']);

    // Doctor statistics
    Route::middleware('role:doctor,doctor-manager,admin')->get('/stats/doctor', [StatsController::class, 'doctor']);

    Route::middleware('role:admin,nurse,receptionist-nurse')->group(function () {
        Route::get('/nurse/instructions', [NurseInstructionController::class, 'myInstructions']);
        Route::patch('/nurse/instructions/{instruction}/complete', [NurseInstructionController::class, 'complete']);
    });

    Route::middleware('role:admin,receptionist,receptionist-nurse,doctor,doctor-manager')->get('/users/nurses', [UserLookupController::class, 'nurses']);
});
