<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Meeting extends Model
{
    use HasFactory;

    protected $table = 'meetings';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'id',
        'trainerId',
        'courseId',
        'startsAt',
        'provider',
        'meetingUrl',
        'agenda',
    ];

    protected $casts = [
        'startsAt' => 'datetime',
    ];
}
