<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Message extends Model
{
    use HasFactory;

    protected $table = 'messages';
    public $incrementing = false;
    protected $keyType = 'string';
    const UPDATED_AT = null;

    protected $fillable = [
        'id',
        'senderId',
        'groupId',
        'recipientId',
        'body',
        'voiceNoteUrl',
        'reactionsOnly',
    ];

    public function sender()
    {
        return $this->belongsTo(User::class, 'senderId');
    }

    public function group()
    {
        return $this->belongsTo(Group::class, 'groupId');
    }

    public function recipient()
    {
        return $this->belongsTo(User::class, 'recipientId');
    }
}
