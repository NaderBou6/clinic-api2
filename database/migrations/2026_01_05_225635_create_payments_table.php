<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('consultation_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('amount_cents'); // installment amount

            $table->enum('method', ['cash', 'card', 'transfer', 'other'])->default('cash');
            $table->string('reference')->nullable(); // optional transaction ref

            $table->foreignId('received_by')->constrained('users')->restrictOnDelete(); // receptionist
            $table->timestamp('received_at')->useCurrent();

            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['consultation_id', 'received_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
