<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Traits\HasUuid;

class Course extends Model
{
    use HasFactory, HasUuid;

    protected $table = 'courses';
    public $incrementing = false;
    protected $keyType = 'string';
    const UPDATED_AT = null;

    protected $fillable = [
        'id',
        'title',
        'description',
        'level',
        'trainerId',
        'status',
        'adminReviewNotes',
    ];

    public function trainer()
    {
        return $this->belongsTo(User::class, 'trainerId');
    }

    public function videos()
    {
        return $this->hasMany(VideoLesson::class, 'courseId');
    }

    public function enrollments()
    {
        return $this->hasMany(Enrollment::class, 'courseId');
    }
}
