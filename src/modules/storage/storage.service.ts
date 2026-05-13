import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

@Injectable()
export class StorageService {
  private client: S3Client;

  constructor(private config: ConfigService) {
    this.client = new S3Client({
      region: this.config.get('AWS_REGION', 'ap-south-1'),
      credentials: this.config.get('AWS_ACCESS_KEY_ID')
        ? {
            accessKeyId: this.config.get('AWS_ACCESS_KEY_ID')!,
            secretAccessKey: this.config.get('AWS_SECRET_ACCESS_KEY')!,
          }
        : undefined,
    });
  }

  async createUploadUrl(folder: 'videos' | 'homework' | 'logos' | 'reports', contentType: string) {
    const bucket = this.config.get('AWS_S3_BUCKET');
    const key = `${folder}/${randomUUID()}`;
    if (!bucket) {
      return { key, uploadUrl: `local-s3-disabled://${key}`, publicUrl: `local-s3-disabled://${key}` };
    }
    const command = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType });
    const uploadUrl = await getSignedUrl(this.client, command, { expiresIn: 900 });
    const cdn = this.config.get('CLOUDFRONT_URL');
    return { key, uploadUrl, publicUrl: cdn ? `${cdn}/${key}` : `https://${bucket}.s3.amazonaws.com/${key}` };
  }
}
