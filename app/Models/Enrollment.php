<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Traits\HasUuid;

class Enrollment extends Model
{
    use HasFactory, HasUuid;

    protected $table = 'enrollments';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'id',
        'learnerId',
        'courseId',
        'status',
        'unlockedVideoPosition',
        'completedAt',
    ];

    protected $casts = [
        'completedAt' => 'datetime',
    ];

    public function learner()
    {
        return $this->belongsTo(User::class, 'learnerId');
    }

    public function course()
    {
        return $this->belongsTo(Course::class, 'courseId');
    }

    public function testAttempts()
    {
        return $this->hasMany(TestAttempt::class, 'enrollmentId');
    }
}
