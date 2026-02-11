<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('queue_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('daily_queue_id')->constrained('daily_queues')->cascadeOnDelete();
            $table->foreignId('patient_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('number');
            $table->enum('status', ['waiting','in_consultation','consulted','cancelled'])
                ->default('waiting')
                ->index();

            $table->timestamps();

            $table->unique(['daily_queue_id','number']);
            $table->index(['daily_queue_id','status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('queue_entries');
    }
};
