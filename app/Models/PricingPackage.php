<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class PricingPackage extends Model
{
    use HasFactory;

    protected $table = 'pricing_packages';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'id',
        'level',
        'duration',
        'pricePerStudentPkr',
        'grapeTaskRevenuePercent',
        'trainerRevenuePercent',
    ];
}
