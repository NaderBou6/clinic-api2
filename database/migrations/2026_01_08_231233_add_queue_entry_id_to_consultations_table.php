<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('consultations', function (Blueprint $table) {
            if (!Schema::hasColumn('consultations', 'queue_entry_id')) {
                $table->foreignId('queue_entry_id')
                    ->nullable()
                    ->after('appointment_id')
                    ->constrained('queue_entries')
                    ->nullOnDelete();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('consultations', function (Blueprint $table) {
            if (Schema::hasColumn('consultations', 'queue_entry_id')) {
                $table->dropConstrainedForeignId('queue_entry_id');
            }
        });
    }
};
