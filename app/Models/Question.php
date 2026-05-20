<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Question extends Model
{
    use HasFactory;

    protected $table = 'questions';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'id',
        'assessmentSetId',
        'type',
        'prompt',
        'options',
        'correctAnswer',
        'points',
    ];

    protected $casts = [
        'options' => 'array',
        'correctAnswer' => 'array',
    ];

    public function assessmentSet()
    {
        return $this->belongsTo(AssessmentSet::class, 'assessmentSetId');
    }
}
