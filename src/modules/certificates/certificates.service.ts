import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import PDFDocument = require('pdfkit');
import { Repository } from 'typeorm';
import { Certificate, Course, User } from '../../database/entities';

@Injectable()
export class CertificatesService {
  constructor(
    @InjectRepository(Certificate) private certificates: Repository<Certificate>,
    @InjectRepository(User) private users: Repository<User>,
    @InjectRepository(Course) private courses: Repository<Course>,
  ) {}

  async issueCertificate(learnerId: string, courseId: string) {
    const existing = await this.certificates.findOne({ where: { learnerId, courseId } });
    if (existing) return existing;

    const learner = await this.users.findOne({ where: { id: learnerId } });
    const course = await this.courses.findOne({ where: { id: courseId } });
    if (!learner || !course) throw new NotFoundException('Learner or course not found');

    const buffer = await this.renderCertificatePdf(learner.name, course.title);
    const certificateUrl = `data:application/pdf;base64,${buffer.toString('base64')}`;
    await this.users.update(learnerId, { marketplaceGigAccess: true });

    return this.certificates.save({
      learnerId,
      courseId,
      badge: 'GrapeTask LMS Certified',
      certificateUrl,
      certificationDate: new Date(),
    });
  }

  findByLearner(learnerId: string) {
    return this.certificates.find({ where: { learnerId }, order: { certificationDate: 'DESC' } });
  }

  private renderCertificatePdf(learnerName: string, courseTitle: string): Promise<Buffer> {
    return new Promise((resolve) => {
      const doc = new PDFDocument({ size: 'A4', margin: 72 });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      doc.rect(20, 20, 555, 802).stroke('#f0591f');
      doc.fillColor('#020617').fontSize(28).text('GrapeTask Certificate', { align: 'center' });
      doc.moveDown(2);
      doc.fillColor('#52525b').fontSize(14).text('This certifies that', { align: 'center' });
      doc.moveDown();
      doc.fillColor('#000000').fontSize(24).text(learnerName, { align: 'center' });
      doc.moveDown();
      doc.fillColor('#52525b').fontSize(14).text('successfully completed', { align: 'center' });
      doc.moveDown();
      doc.fillColor('#f0591f').fontSize(20).text(courseTitle, { align: 'center' });
      doc.moveDown(2);
      doc.fillColor('#000000').fontSize(16).text('Badge: GrapeTask LMS Certified', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Certification Date: ${new Date().toDateString()}`, { align: 'center' });
      doc.end();
    });
  }
}
