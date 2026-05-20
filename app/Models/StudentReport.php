<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class StudentReport extends Model
{
    use HasFactory;

    protected $table = 'student_reports';
    public $incrementing = false;
    protected $keyType = 'string';
    const UPDATED_AT = null;

    protected $fillable = [
        'id',
        'learnerId',
        'trainerId',
        'institutionId',
        'courseId',
        'remarks',
        'progressSnapshot',
        'reportUrl',
    ];

    protected $casts = [
        'progressSnapshot' => 'array',
    ];
}
