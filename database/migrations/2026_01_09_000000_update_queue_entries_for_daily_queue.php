<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('queue_entries', function (Blueprint $table) {
            if (!Schema::hasColumn('queue_entries', 'daily_queue_id')) {
                $table->unsignedBigInteger('daily_queue_id')->nullable()->after('id');
            }
            if (!Schema::hasColumn('queue_entries', 'number')) {
                $table->unsignedInteger('number')->nullable()->after('patient_id');
            }
        });

        if (Schema::hasTable('daily_queues') && Schema::hasColumn('queue_entries', 'queue_date')) {
            $dates = DB::table('queue_entries')
                ->select('queue_date')
                ->distinct()
                ->get();

            foreach ($dates as $row) {
                DB::table('daily_queues')->updateOrInsert(
                    ['queue_date' => $row->queue_date],
                    ['current_number' => 0, 'created_at' => now(), 'updated_at' => now()]
                );
            }

            $dailyQueues = DB::table('daily_queues')->get();
            foreach ($dailyQueues as $dq) {
                $maxNumber = (int) DB::table('queue_entries')
                    ->where('queue_date', $dq->queue_date)
                    ->whereIn('status', ['in_treatment', 'done'])
                    ->max('queue_number');
                if ($maxNumber > 0) {
                    DB::table('daily_queues')
                        ->where('id', $dq->id)
                        ->update(['current_number' => $maxNumber]);
                }
            }
        }

        if (Schema::hasColumn('queue_entries', 'queue_number')) {
            DB::statement('UPDATE queue_entries SET number = queue_number WHERE number IS NULL');
        }

        if (Schema::hasColumn('queue_entries', 'queue_date')) {
            DB::statement(
                'UPDATE queue_entries qe
                 JOIN daily_queues dq ON dq.queue_date = qe.queue_date
                 SET qe.daily_queue_id = dq.id
                 WHERE qe.daily_queue_id IS NULL'
            );
        }

        DB::statement("UPDATE queue_entries SET status = 'in_consultation' WHERE status = 'in_treatment'");
        DB::statement("UPDATE queue_entries SET status = 'consulted' WHERE status = 'done'");
        DB::statement(
            "ALTER TABLE queue_entries MODIFY status ENUM('waiting','in_consultation','consulted','cancelled') NOT NULL DEFAULT 'waiting'"
        );

        DB::statement('ALTER TABLE queue_entries MODIFY daily_queue_id BIGINT UNSIGNED NOT NULL');
        DB::statement('ALTER TABLE queue_entries MODIFY number INT UNSIGNED NOT NULL');

        $dbName = DB::getDatabaseName();
        $foreignKeyName = 'queue_entries_daily_queue_id_foreign';
        $uniqueName = 'queue_entries_daily_queue_id_number_unique';
        $statusIndexName = 'queue_entries_daily_queue_id_status_index';

        $foreignKeyExists = DB::table('information_schema.table_constraints')
            ->where('table_schema', $dbName)
            ->where('table_name', 'queue_entries')
            ->where('constraint_name', $foreignKeyName)
            ->exists();

        $uniqueExists = DB::table('information_schema.statistics')
            ->where('table_schema', $dbName)
            ->where('table_name', 'queue_entries')
            ->where('index_name', $uniqueName)
            ->exists();

        $statusIndexExists = DB::table('information_schema.statistics')
            ->where('table_schema', $dbName)
            ->where('table_name', 'queue_entries')
            ->where('index_name', $statusIndexName)
            ->exists();

        Schema::table('queue_entries', function (Blueprint $table) use ($foreignKeyExists, $uniqueExists, $statusIndexExists, $foreignKeyName) {
            if (!$foreignKeyExists) {
                $table->foreign('daily_queue_id', $foreignKeyName)->references('id')->on('daily_queues')->cascadeOnDelete();
            }
            if (!$uniqueExists) {
                $table->unique(['daily_queue_id', 'number']);
            }
            if (!$statusIndexExists) {
                $table->index(['daily_queue_id', 'status']);
            }
        });

        $indexes = [
            'queue_entries_queue_date_patient_id_unique',
            'queue_entries_queue_date_index',
            'queue_entries_queue_number_index',
        ];
        foreach ($indexes as $indexName) {
            $exists = DB::table('information_schema.statistics')
                ->where('table_schema', $dbName)
                ->where('table_name', 'queue_entries')
                ->where('index_name', $indexName)
                ->exists();
            if ($exists) {
                DB::statement("ALTER TABLE queue_entries DROP INDEX {$indexName}");
            }
        }

        Schema::table('queue_entries', function (Blueprint $table) {
            if (Schema::hasColumn('queue_entries', 'queue_date')) {
                $table->dropColumn('queue_date');
            }
            if (Schema::hasColumn('queue_entries', 'queue_number')) {
                $table->dropColumn('queue_number');
            }
            if (Schema::hasColumn('queue_entries', 'started_at')) {
                $table->dropColumn('started_at');
            }
            if (Schema::hasColumn('queue_entries', 'done_at')) {
                $table->dropColumn('done_at');
            }
            if (Schema::hasColumn('queue_entries', 'created_by')) {
                $table->dropColumn('created_by');
            }
        });
    }

    public function down(): void
    {
        Schema::table('queue_entries', function (Blueprint $table) {
            if (!Schema::hasColumn('queue_entries', 'queue_date')) {
                $table->date('queue_date')->nullable()->index();
            }
            if (!Schema::hasColumn('queue_entries', 'queue_number')) {
                $table->unsignedInteger('queue_number')->nullable()->index();
            }
            if (!Schema::hasColumn('queue_entries', 'started_at')) {
                $table->timestamp('started_at')->nullable();
            }
            if (!Schema::hasColumn('queue_entries', 'done_at')) {
                $table->timestamp('done_at')->nullable();
            }
            if (!Schema::hasColumn('queue_entries', 'created_by')) {
                $table->foreignId('created_by')->nullable()->constrained('users')->restrictOnDelete();
            }
        });

        DB::statement("ALTER TABLE queue_entries MODIFY status ENUM('waiting','in_treatment','done','cancelled') NOT NULL DEFAULT 'waiting'");

        Schema::table('queue_entries', function (Blueprint $table) {
            if (Schema::hasColumn('queue_entries', 'daily_queue_id')) {
                $table->dropForeign(['daily_queue_id']);
                $table->dropColumn('daily_queue_id');
            }
            if (Schema::hasColumn('queue_entries', 'number')) {
                $table->dropColumn('number');
            }
        });
    }
};
