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
    Schema::create('test_request_items', function (Blueprint $table) {
        $table->id();
        $table->foreignId('test_request_id')->constrained()->cascadeOnDelete();
        $table->string('test_name');
        $table->string('notes')->nullable();
        $table->enum('status', ['requested','done'])->default('requested')->index();
        $table->timestamps();
    });
}

public function down(): void {
    Schema::dropIfExists('test_request_items');
}

};
