<?php

namespace App\GraphQL\Mutations;

use App\Models\Enrollment;
use App\Models\Course;
use Illuminate\Support\Facades\Auth;

class EnrollmentMutator
{
    public function enroll($root, array $args)
    {
        $user = Auth::user();
        $courseId = $args['courseId'];

        $enrollment = Enrollment::firstOrCreate([
            'learnerId' => $user->id,
            'courseId' => $courseId,
        ], [
            'status' => 'active',
            'unlockedVideoPosition' => 1,
        ]);

        return $enrollment;
    }
}
