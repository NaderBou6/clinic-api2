<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void {
    Schema::create('test_requests', function (Blueprint $table) {
        $table->id();
        $table->foreignId('consultation_id')->constrained()->cascadeOnDelete();
        $table->timestamps();
    });
}

public function down(): void {
    Schema::dropIfExists('test_requests');
}

};
