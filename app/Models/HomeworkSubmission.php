<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class HomeworkSubmission extends Model
{
    use HasFactory;

    protected $table = 'homework_submissions';
    public $incrementing = false;
    protected $keyType = 'string';
    const UPDATED_AT = null;

    protected $fillable = [
        'id',
        'enrollmentId',
        'videoId',
        'fileUrl',
        'textAnswer',
        'trainerDecision',
        'trainerRemarks',
    ];

    public function enrollment()
    {
        return $this->belongsTo(Enrollment::class, 'enrollmentId');
    }

    public function video()
    {
        return $this->belongsTo(VideoLesson::class, 'videoId');
    }
}
