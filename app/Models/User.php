<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

use App\Traits\HasUuid;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, HasUuid;

    protected $table = 'lms_users';
    public $incrementing = false;
    protected $keyType = 'string';

    const CREATED_AT = 'createdAt';
    const UPDATED_AT = 'updatedAt';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'id',
        'name',
        'email',
        'passwordHash',
        'role',
        'learnerCategory',
        'trainerLevel',
        'portfolio',
        'teachingExperience',
        'joiningReason',
        'institutionId',
        'marketplaceGigAccess',
        'globalGroupJoined',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'passwordHash',
        'remember_token',
    ];

    /**
     * Get the password for the user.
     *
     * @return string
     */
    public function getAuthPassword()
    {
        return $this->passwordHash;
    }

    public function institution()
    {
        return $this->belongsTo(Institution::class, 'institutionId');
    }

    public function courses()
    {
        return $this->hasMany(Course::class, 'trainerId');
    }

    public function enrollments()
    {
        return $this->hasMany(Enrollment::class, 'learnerId');
    }
}
