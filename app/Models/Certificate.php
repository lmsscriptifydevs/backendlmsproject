<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Certificate extends Model
{
    use HasFactory;

    protected $table = 'certificates';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'id',
        'learnerId',
        'courseId',
        'badge',
        'certificateUrl',
        'certificationDate',
    ];

    protected $casts = [
        'certificationDate' => 'datetime',
    ];
}
