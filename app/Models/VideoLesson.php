<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class VideoLesson extends Model
{
    use HasFactory;

    protected $table = 'video_lessons';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'id',
        'courseId',
        'title',
        'position',
        'videoUrl',
        'summary',
    ];

    public function course()
    {
        return $this->belongsTo(Course::class, 'courseId');
    }

    public function assessmentSets()
    {
        return $this->hasMany(AssessmentSet::class, 'videoId');
    }
}
