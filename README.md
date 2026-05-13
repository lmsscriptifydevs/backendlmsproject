# GrapeTask LMS Backend

NestJS + MySQL REST API for the GrapeTask LMS System.

## Stack

- NestJS / Node.js
- MySQL database: `grapetask_lms`
- TypeORM migrations
- JWT authentication
- RBAC roles: `admin`, `trainer`, `learner`, `institute_head`
- AWS S3 presigned uploads for videos, homework, logos, and reports
- PDF certificate and progress report generation

## Setup

```bash
cp .env.example .env
npm install
npm run migration:run
npm run seed
npm run start:dev
```

API docs are available at:

```text
http://localhost:4000/api/docs
```

## Demo Logins

After `npm run seed`, all demo users use:

```text
Password123!
```

- `admin@grapetask.com`
- `trainer@grapetask.com`
- `learner@grapetask.com`
- `head@grapetask.com`

## Core LMS Rules Implemented

- Course approval is admin-controlled.
- Every video can have multiple assessment sets for retests.
- Progressive tests are cumulative: after video 2, the test includes video 1 and 2; after video 3, it includes videos 1, 2, and 3.
- Video unlocking only advances after passing the current progressive test.
- Retests prefer unused assessment sets so the same set is not repeated when alternatives exist.
- Trainer homework review supports `pass`, `fail`, and `improve`.
- Final progressive test completion issues the `GrapeTask LMS Certified` badge and certificate PDF, then enables marketplace gig access.
- Institution pricing includes monthly, six-month, and yearly packages with 30% / 70% GrapeTask-trainer revenue split.

## Main Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/courses`
- `POST /api/courses/:id/videos`
- `POST /api/courses/videos/:videoId/assessment-sets`
- `PATCH /api/courses/:id/admin-review`
- `POST /api/courses/:id/enroll`
- `GET /api/assessments/enrollments/:enrollmentId/after-video/:position`
- `POST /api/assessments/enrollments/:enrollmentId/after-video/:position/submit`
- `POST /api/submissions/homework`
- `PATCH /api/submissions/:id/review`
- `POST /api/reports`
- `GET /api/certificates/mine`

## Notes

This backend is intentionally separate from `frontend/` so it can be pushed to its own repository.
