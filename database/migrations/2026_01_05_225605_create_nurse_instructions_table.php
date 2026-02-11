<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('nurse_instructions', function (Blueprint $table) {
            $table->id();

            $table->foreignId('patient_id')->constrained()->cascadeOnDelete();
            $table->foreignId('consultation_id')->nullable()->constrained()->nullOnDelete();

            $table->foreignId('created_by_doctor_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('assigned_to_nurse_id')->nullable()->constrained('users')->nullOnDelete();

            $table->text('instruction');

            $table->enum('status', ['pending', 'completed'])->default('pending')->index();

            $table->foreignId('completed_by_nurse_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('completed_at')->nullable();

            $table->timestamps();

            $table->index(['patient_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('nurse_instructions');
    }
};
