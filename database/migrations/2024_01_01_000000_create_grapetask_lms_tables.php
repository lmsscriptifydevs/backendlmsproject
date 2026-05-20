<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('institutions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->enum('level', ['school', 'college', 'university', 'individual']);
            $table->integer('studentCount')->default(0);
            $table->string('logoUrl')->nullable();
            $table->string('portalSlug')->nullable();
        });

        Schema::create('lms_users', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('passwordHash');
            $table->enum('role', ['admin', 'trainer', 'learner', 'institute_head']);
            $table->enum('learnerCategory', ['school_student', 'college_student', 'university_student', 'individual_learner'])->nullable();
            $table->enum('trainerLevel', ['school', 'college', 'university', 'individual'])->nullable();
            $table->text('portfolio')->nullable();
            $table->text('teachingExperience')->nullable();
            $table->text('joiningReason')->nullable();
            $table->uuid('institutionId')->nullable();
            $table->boolean('marketplaceGigAccess')->default(false);
            $table->boolean('globalGroupJoined')->default(false);
            $table->timestamp('createdAt', 6)->useCurrent();
            $table->timestamp('updatedAt', 6)->useCurrent()->useCurrentOnUpdate();

            $table->foreign('institutionId')->references('id')->on('institutions')->onDelete('set null');
        });

        Schema::create('pricing_packages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->enum('level', ['school', 'college', 'university', 'individual']);
            $table->enum('duration', ['monthly', 'six_months', 'yearly']);
            $table->integer('pricePerStudentPkr');
            $table->integer('grapeTaskRevenuePercent')->default(30);
            $table->integer('trainerRevenuePercent')->default(70);
        });

        Schema::create('courses', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('title');
            $table->text('description');
            $table->enum('level', ['school', 'college', 'university', 'individual']);
            $table->uuid('trainerId');
            $table->enum('status', ['draft', 'pending_review', 'approved', 'rejected'])->default('draft');
            $table->text('adminReviewNotes')->nullable();
            $table->timestamp('createdAt', 6)->useCurrent();

            $table->foreign('trainerId')->references('id')->on('lms_users');
        });

        Schema::create('video_lessons', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('courseId');
            $table->string('title');
            $table->integer('position');
            $table->string('videoUrl');
            $table->text('summary')->nullable();
            $table->unique(['courseId', 'position']);

            $table->foreign('courseId')->references('id')->on('courses')->onDelete('cascade');
        });

        Schema::create('assessment_sets', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('videoId');
            $table->string('title');
            $table->integer('version')->default(1);
            $table->boolean('active')->default(true);

            $table->foreign('videoId')->references('id')->on('video_lessons')->onDelete('cascade');
        });

        Schema::create('questions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('assessmentSetId');
            $table->enum('type', ['mcq', 'quiz', 'summary', 'homework']);
            $table->text('prompt');
            $table->json('options')->nullable();
            $table->json('correctAnswer')->nullable();
            $table->integer('points')->default(1);

            $table->foreign('assessmentSetId')->references('id')->on('assessment_sets')->onDelete('cascade');
        });

        Schema::create('enrollments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('learnerId');
            $table->uuid('courseId');
            $table->enum('status', ['active', 'completed', 'suspended'])->default('active');
            $table->integer('unlockedVideoPosition')->default(1);
            $table->timestamp('completedAt')->nullable();
            $table->unique(['learnerId', 'courseId']);

            $table->foreign('learnerId')->references('id')->on('lms_users');
            $table->foreign('courseId')->references('id')->on('courses');
        });

        Schema::create('test_attempts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('enrollmentId');
            $table->integer('afterVideoPosition');
            $table->json('assessmentSetIds');
            $table->json('answers');
            $table->integer('score')->default(0);
            $table->integer('maxScore')->default(0);
            $table->boolean('passed')->default(false);
            $table->timestamp('createdAt', 6)->useCurrent();

            $table->foreign('enrollmentId')->references('id')->on('enrollments');
        });

        Schema::create('homework_submissions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('enrollmentId');
            $table->uuid('videoId');
            $table->string('fileUrl')->nullable();
            $table->text('textAnswer')->nullable();
            $table->enum('trainerDecision', ['pass', 'fail', 'improve'])->nullable();
            $table->text('trainerRemarks')->nullable();
            $table->timestamp('createdAt', 6)->useCurrent();

            $table->foreign('enrollmentId')->references('id')->on('enrollments');
            $table->foreign('videoId')->references('id')->on('video_lessons');
        });

        Schema::create('certificates', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('learnerId');
            $table->uuid('courseId');
            $table->string('badge');
            $table->longText('certificateUrl');
            $table->timestamp('certificationDate');
        });

        Schema::create('student_reports', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('learnerId');
            $table->uuid('trainerId');
            $table->uuid('institutionId');
            $table->uuid('courseId');
            $table->text('remarks');
            $table->json('progressSnapshot');
            $table->longText('reportUrl');
            $table->timestamp('createdAt', 6)->useCurrent();
        });

        Schema::create('groups', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('type', 64);
            $table->uuid('institutionId')->nullable();
        });

        Schema::create('group_members', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('groupId');
            $table->uuid('userId');
            $table->unique(['groupId', 'userId']);
        });

        Schema::create('messages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('senderId');
            $table->uuid('groupId')->nullable();
            $table->uuid('recipientId')->nullable();
            $table->text('body');
            $table->string('voiceNoteUrl')->nullable();
            $table->boolean('reactionsOnly')->default(false);
            $table->timestamp('createdAt', 6)->useCurrent();
        });

        Schema::create('meetings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('trainerId');
            $table->uuid('courseId');
            $table->timestamp('startsAt');
            $table->string('provider', 32);
            $table->string('meetingUrl');
            $table->text('agenda')->nullable();
        });

        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('userId');
            $table->string('title');
            $table->text('body');
            $table->boolean('read')->default(false);
            $table->timestamp('createdAt', 6)->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('meetings');
        Schema::dropIfExists('messages');
        Schema::dropIfExists('group_members');
        Schema::dropIfExists('groups');
        Schema::dropIfExists('student_reports');
        Schema::dropIfExists('certificates');
        Schema::dropIfExists('homework_submissions');
        Schema::dropIfExists('test_attempts');
        Schema::dropIfExists('enrollments');
        Schema::dropIfExists('questions');
        Schema::dropIfExists('assessment_sets');
        Schema::dropIfExists('video_lessons');
        Schema::dropIfExists('courses');
        Schema::dropIfExists('pricing_packages');
        Schema::dropIfExists('lms_users');
        Schema::dropIfExists('institutions');
    }
};
