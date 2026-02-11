<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('consultations', function (Blueprint $table) {
            $table->id();
            $table->string('consultation_number')->unique();

            $table->foreignId('patient_id')->constrained()->cascadeOnDelete();
            $table->foreignId('doctor_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('appointment_id')->nullable()->constrained()->nullOnDelete();

            $table->string('chief_complaint')->nullable();
            $table->text('symptoms')->nullable();
            $table->text('diagnosis')->nullable();
            $table->text('notes')->nullable();

            $table->unsignedInteger('price_cents')->nullable();
            $table->enum('payment_status', ['unpaid','partial','paid'])->default('unpaid')->index();
            $table->timestamps();

            $table->index(['patient_id','created_at']);
            $table->index(['doctor_id','created_at']);
        });
    }
    public function down(): void { Schema::dropIfExists('consultations'); }
};
