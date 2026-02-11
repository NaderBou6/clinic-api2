<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('patients', function (Blueprint $table) {
            $table->id();
            $table->string('patient_code')->unique();
            $table->string('first_name');
            $table->string('last_name');
            $table->string('phone')->unique();
            $table->date('dob')->nullable();
            $table->date('place_of_birth')->nullable();
            $table->enum('gender', ['male','female'])->nullable();
            $table->string('address')->nullable();
            $table->text('medical_history_summary')->nullable();
            $table->timestamps();
            $table->index(['last_name','first_name']);
        });
    }
    public function down(): void { Schema::dropIfExists('patients'); }
};
