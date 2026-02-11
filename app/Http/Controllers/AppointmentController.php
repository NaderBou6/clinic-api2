<?php

namespace App\Http\Controllers;

use App\Http\Requests\Appointments\StoreAppointmentRequest;
use App\Models\Appointment;
use Illuminate\Http\Request;

class AppointmentController extends Controller
{
    public function index(Request $request)
    {
        $doctorId = $request->query('doctor_id');
        $date = $request->query('date'); // YYYY-MM-DD

        $q = Appointment::with(['patient','doctor'])->orderBy('start_time');

        if ($doctorId) $q->where('doctor_id', $doctorId);
        if ($date) $q->whereDate('start_time', $date);

        return $q->paginate(15);
    }

    public function store(StoreAppointmentRequest $request)
    {
        $data = $request->validated();

        // ensure doctor role (optional strict check)
        // could validate via custom rule; for now keep simple.

        $appointment = Appointment::create($data);
        return response()->json($appointment->load(['patient','doctor']), 201);
    }

    public function show(Appointment $appointment)
    {
        return response()->json($appointment->load(['patient','doctor','consultation']));
    }

    public function update(StoreAppointmentRequest $request, Appointment $appointment)
    {
        $appointment->update($request->validated());
        return response()->json($appointment->fresh()->load(['patient','doctor']));
    }

    public function destroy(Appointment $appointment)
    {
        $appointment->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
