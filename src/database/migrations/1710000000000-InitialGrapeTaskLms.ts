import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialGrapeTaskLms1710000000000 implements MigrationInterface {
  name = 'InitialGrapeTaskLms1710000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS lms_users (
        id varchar(36) PRIMARY KEY,
        name varchar(255) NOT NULL,
        email varchar(255) NOT NULL UNIQUE,
        passwordHash varchar(255) NOT NULL,
        role enum('admin','trainer','learner','institute_head') NOT NULL,
        learnerCategory enum('school_student','college_student','university_student','individual_learner') NULL,
        trainerLevel enum('school','college','university','individual') NULL,
        portfolio text NULL,
        teachingExperience text NULL,
        joiningReason text NULL,
        institutionId varchar(36) NULL,
        marketplaceGigAccess tinyint NOT NULL DEFAULT 0,
        globalGroupJoined tinyint NOT NULL DEFAULT 0,
        createdAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updatedAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS institutions (
        id varchar(36) PRIMARY KEY,
        name varchar(255) NOT NULL,
        level enum('school','college','university','individual') NOT NULL,
        studentCount int NOT NULL DEFAULT 0,
        logoUrl varchar(255) NULL,
        portalSlug varchar(255) NULL
      )
    `);
    await this.addColumnIfMissing(queryRunner, 'lms_users', 'institutionId', `ALTER TABLE lms_users ADD institutionId varchar(36) NULL`);
    await this.addForeignKeyIfMissing(
      queryRunner,
      'FK_lms_users_institution',
      `ALTER TABLE lms_users ADD CONSTRAINT FK_lms_users_institution FOREIGN KEY (institutionId) REFERENCES institutions(id) ON DELETE SET NULL`,
    );
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS pricing_packages (
        id varchar(36) PRIMARY KEY,
        level enum('school','college','university','individual') NOT NULL,
        duration enum('monthly','six_months','yearly') NOT NULL,
        pricePerStudentPkr int NOT NULL,
        grapeTaskRevenuePercent int NOT NULL DEFAULT 30,
        trainerRevenuePercent int NOT NULL DEFAULT 70
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS courses (
        id varchar(36) PRIMARY KEY,
        title varchar(255) NOT NULL,
        description text NOT NULL,
        level enum('school','college','university','individual') NOT NULL,
        trainerId varchar(36) NOT NULL,
        status enum('draft','pending_review','approved','rejected') NOT NULL DEFAULT 'draft',
        adminReviewNotes text NULL,
        createdAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        CONSTRAINT FK_courses_trainer FOREIGN KEY (trainerId) REFERENCES lms_users(id)
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS video_lessons (
        id varchar(36) PRIMARY KEY,
        courseId varchar(36) NOT NULL,
        title varchar(255) NOT NULL,
        position int NOT NULL,
        videoUrl varchar(255) NOT NULL,
        summary text NULL,
        UNIQUE KEY UQ_video_course_position (courseId, position),
        CONSTRAINT FK_videos_course FOREIGN KEY (courseId) REFERENCES courses(id) ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS assessment_sets (
        id varchar(36) PRIMARY KEY,
        videoId varchar(36) NOT NULL,
        title varchar(255) NOT NULL,
        version int NOT NULL DEFAULT 1,
        active tinyint NOT NULL DEFAULT 1,
        CONSTRAINT FK_sets_video FOREIGN KEY (videoId) REFERENCES video_lessons(id) ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS questions (
        id varchar(36) PRIMARY KEY,
        assessmentSetId varchar(36) NOT NULL,
        type enum('mcq','quiz','summary','homework') NOT NULL,
        prompt text NOT NULL,
        options json NULL,
        correctAnswer json NULL,
        points int NOT NULL DEFAULT 1,
        CONSTRAINT FK_questions_set FOREIGN KEY (assessmentSetId) REFERENCES assessment_sets(id) ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS enrollments (
        id varchar(36) PRIMARY KEY,
        learnerId varchar(36) NOT NULL,
        courseId varchar(36) NOT NULL,
        status enum('active','completed','suspended') NOT NULL DEFAULT 'active',
        unlockedVideoPosition int NOT NULL DEFAULT 1,
        completedAt datetime NULL,
        UNIQUE KEY UQ_enrollment_learner_course (learnerId, courseId),
        CONSTRAINT FK_enrollments_learner FOREIGN KEY (learnerId) REFERENCES lms_users(id),
        CONSTRAINT FK_enrollments_course FOREIGN KEY (courseId) REFERENCES courses(id)
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS test_attempts (
        id varchar(36) PRIMARY KEY,
        enrollmentId varchar(36) NOT NULL,
        afterVideoPosition int NOT NULL,
        assessmentSetIds json NOT NULL,
        answers json NOT NULL,
        score int NOT NULL DEFAULT 0,
        maxScore int NOT NULL DEFAULT 0,
        passed tinyint NOT NULL DEFAULT 0,
        createdAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        CONSTRAINT FK_attempts_enrollment FOREIGN KEY (enrollmentId) REFERENCES enrollments(id)
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS homework_submissions (
        id varchar(36) PRIMARY KEY,
        enrollmentId varchar(36) NOT NULL,
        videoId varchar(36) NOT NULL,
        fileUrl varchar(255) NULL,
        textAnswer text NULL,
        trainerDecision enum('pass','fail','improve') NULL,
        trainerRemarks text NULL,
        createdAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        CONSTRAINT FK_submissions_enrollment FOREIGN KEY (enrollmentId) REFERENCES enrollments(id),
        CONSTRAINT FK_submissions_video FOREIGN KEY (videoId) REFERENCES video_lessons(id)
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS certificates (
        id varchar(36) PRIMARY KEY,
        learnerId varchar(36) NOT NULL,
        courseId varchar(36) NOT NULL,
        badge varchar(255) NOT NULL,
        certificateUrl longtext NOT NULL,
        certificationDate datetime NOT NULL
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS student_reports (
        id varchar(36) PRIMARY KEY,
        learnerId varchar(36) NOT NULL,
        trainerId varchar(36) NOT NULL,
        institutionId varchar(36) NOT NULL,
        courseId varchar(36) NOT NULL,
        remarks text NOT NULL,
        progressSnapshot json NOT NULL,
        reportUrl longtext NOT NULL,
        createdAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS groups (
        id varchar(36) PRIMARY KEY,
        name varchar(255) NOT NULL,
        type varchar(64) NOT NULL,
        institutionId varchar(36) NULL
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS group_members (
        id varchar(36) PRIMARY KEY,
        groupId varchar(36) NOT NULL,
        userId varchar(36) NOT NULL,
        UNIQUE KEY UQ_group_user (groupId, userId)
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id varchar(36) PRIMARY KEY,
        senderId varchar(36) NOT NULL,
        groupId varchar(36) NULL,
        recipientId varchar(36) NULL,
        body text NOT NULL,
        voiceNoteUrl varchar(255) NULL,
        reactionsOnly tinyint NOT NULL DEFAULT 0,
        createdAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS meetings (
        id varchar(36) PRIMARY KEY,
        trainerId varchar(36) NOT NULL,
        courseId varchar(36) NOT NULL,
        startsAt datetime NOT NULL,
        provider varchar(32) NOT NULL,
        meetingUrl varchar(255) NOT NULL,
        agenda text NULL
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id varchar(36) PRIMARY KEY,
        userId varchar(36) NOT NULL,
        title varchar(255) NOT NULL,
        body text NOT NULL,
        \`read\` tinyint NOT NULL DEFAULT 0,
        createdAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
      )
    `);
  }

  private async addForeignKeyIfMissing(queryRunner: QueryRunner, constraintName: string, sql: string) {
    const rows = await queryRunner.query(
      `
        SELECT CONSTRAINT_NAME
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = DATABASE()
          AND CONSTRAINT_NAME = ?
      `,
      [constraintName],
    );

    if (!rows.length) {
      await queryRunner.query(sql);
    }
  }

  private async addColumnIfMissing(queryRunner: QueryRunner, tableName: string, columnName: string, sql: string) {
    const rows = await queryRunner.query(
      `
        SELECT COLUMN_NAME
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
          AND COLUMN_NAME = ?
      `,
      [tableName, columnName],
    );

    if (!rows.length) {
      await queryRunner.query(sql);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tables = [
      'notifications',
      'meetings',
      'messages',
      'group_members',
      'groups',
      'student_reports',
      'certificates',
      'homework_submissions',
      'test_attempts',
      'enrollments',
      'questions',
      'assessment_sets',
      'video_lessons',
      'courses',
      'pricing_packages',
      'lms_users',
      'institutions',
    ];
    for (const table of tables) {
      await queryRunner.query(`DROP TABLE IF EXISTS ${table}`);
    }
  }
}
