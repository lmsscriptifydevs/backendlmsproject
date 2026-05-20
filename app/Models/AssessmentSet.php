<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class AssessmentSet extends Model
{
    use HasFactory;

    protected $table = 'assessment_sets';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'id',
        'videoId',
        'title',
        'version',
        'active',
    ];

    public function video()
    {
        return $this->belongsTo(VideoLesson::class, 'videoId');
    }

    public function questions()
    {
        return $this->hasMany(Question::class, 'assessmentSetId');
    }
}
