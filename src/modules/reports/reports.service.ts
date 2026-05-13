import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as nodemailer from 'nodemailer';
import PDFDocument = require('pdfkit');
import { Repository } from 'typeorm';
import { Course, Institution, StudentReport, User } from '../../database/entities';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(StudentReport) private reports: Repository<StudentReport>,
    @InjectRepository(User) private users: Repository<User>,
    @InjectRepository(Course) private courses: Repository<Course>,
    @InjectRepository(Institution) private institutions: Repository<Institution>,
    private config: ConfigService,
  ) {}

  async create(input: { learnerId: string; trainerId: string; institutionId: string; courseId: string; remarks: string }) {
    const [learner, trainer, course, institution] = await Promise.all([
      this.users.findOne({ where: { id: input.learnerId } }),
      this.users.findOne({ where: { id: input.trainerId } }),
      this.courses.findOne({ where: { id: input.courseId } }),
      this.institutions.findOne({ where: { id: input.institutionId } }),
    ]);
    if (!learner || !trainer || !course || !institution) throw new NotFoundException('Report relationship not found');

    const progressSnapshot = {
      learner: learner.name,
      trainer: trainer.name,
      course: course.title,
      generatedAt: new Date().toISOString(),
    };
    const pdf = await this.renderReportPdf(institution, learner, trainer, course, input.remarks, progressSnapshot);
    const reportUrl = `data:application/pdf;base64,${pdf.toString('base64')}`;
    return this.reports.save({ ...input, progressSnapshot, reportUrl });
  }

  institutionReports(institutionId: string) {
    return this.reports.find({ where: { institutionId }, order: { createdAt: 'DESC' } });
  }

  async emailReport(reportId: string, to: string) {
    const report = await this.reports.findOne({ where: { id: reportId } });
    if (!report) throw new NotFoundException('Report not found');
    if (!this.config.get('SMTP_HOST')) return { skipped: true, reason: 'SMTP is not configured' };
    const transporter = nodemailer.createTransport({
      host: this.config.get('SMTP_HOST'),
      port: Number(this.config.get('SMTP_PORT', 587)),
      auth: { user: this.config.get('SMTP_USER'), pass: this.config.get('SMTP_PASS') },
    });
    await transporter.sendMail({
      from: this.config.get('MAIL_FROM'),
      to,
      subject: 'GrapeTask LMS Student Progress Report',
      text: 'Your requested student progress report is attached in the LMS inbox.',
    });
    return { sent: true };
  }

  private renderReportPdf(
    institution: Institution,
    learner: User,
    trainer: User,
    course: Course,
    remarks: string,
    snapshot: Record<string, unknown>,
  ): Promise<Buffer> {
    return new Promise((resolve) => {
      const doc = new PDFDocument({ margin: 60 });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.fillColor('#f0591f').fontSize(22).text('GrapeTask LMS Progress Report');
      doc.fillColor('#020617').fontSize(14).text(institution.name);
      doc.moveDown();
      doc.fontSize(12).text(`Student: ${learner.name}`);
      doc.text(`Trainer: ${trainer.name}`);
      doc.text(`Course: ${course.title}`);
      doc.text(`Generated: ${new Date().toDateString()}`);
      doc.moveDown();
      doc.fontSize(14).text('Trainer Remarks');
      doc.fontSize(12).text(remarks);
      doc.moveDown();
      doc.text(JSON.stringify(snapshot, null, 2));
      doc.end();
    });
  }
}
