<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class TestAttempt extends Model
{
    use HasFactory;

    protected $table = 'test_attempts';
    public $incrementing = false;
    protected $keyType = 'string';
    const UPDATED_AT = null;

    protected $fillable = [
        'id',
        'enrollmentId',
        'afterVideoPosition',
        'assessmentSetIds',
        'answers',
        'score',
        'maxScore',
        'passed',
    ];

    protected $casts = [
        'assessmentSetIds' => 'array',
        'answers' => 'array',
        'passed' => 'boolean',
    ];

    public function enrollment()
    {
        return $this->belongsTo(Enrollment::class, 'enrollmentId');
    }
}
