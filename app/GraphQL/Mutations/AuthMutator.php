<?php

namespace App\GraphQL\Mutations;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Arr;
use Illuminate\Validation\ValidationException;

class AuthMutator
{
    public function login($root, array $args)
    {
        $user = User::where('email', $args['email'])->first();

        if (!$user || !Hash::check($args['password'], $user->passwordHash)) {
            throw ValidationException::withMessages([
                'email' => ['Invalid credentials.'],
            ]);
        }

        return [
            'access_token' => $user->createToken('auth_token')->plainTextToken,
            'user' => $user,
        ];
    }

    public function register($root, array $args)
    {
        $user = User::create([
            'name' => $args['name'],
            'email' => $args['email'],
            'passwordHash' => Hash::make($args['password']),
            'role' => $args['role'],
        ]);

        return $user;
    }
}
