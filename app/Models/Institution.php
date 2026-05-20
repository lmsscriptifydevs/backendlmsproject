<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Traits\HasUuid;

class Institution extends Model
{
    use HasFactory, HasUuid;

    protected $table = 'institutions';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = ['id', 'name', 'level', 'studentCount', 'logoUrl', 'portalSlug'];

    public function users()
    {
        return $this->hasMany(User::class, 'institutionId');
    }
}
