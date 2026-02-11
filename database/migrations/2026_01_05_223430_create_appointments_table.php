<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('appointments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained()->cascadeOnDelete();
            $table->foreignId('doctor_id')->constrained('users')->restrictOnDelete();

            $table->dateTime('start_time');
            $table->dateTime('end_time');

            $table->enum('status', ['scheduled','completed','cancelled','no_show'])
                ->default('scheduled')->index();

            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['doctor_id','start_time']);
            $table->index(['patient_id','start_time']);
        });
    }
    public function down(): void { Schema::dropIfExists('appointments'); }
};
