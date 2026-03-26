import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  private readonly configured: boolean;
  private readonly folder: string;

  constructor() {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
    const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
    const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

    this.configured = Boolean(cloudName && apiKey && apiSecret);
    this.folder =
      process.env.CLOUDINARY_UPLOAD_FOLDER?.trim() ||
      'chargelox/actividades-tecnicas';

    if (this.configured) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
      });
    }
  }

  isConfigured(): boolean {
    return this.configured;
  }

  async uploadLocalFile(path: string): Promise<{
    publicId: string;
    secureUrl: string;
  }> {
    const response = await cloudinary.uploader.upload(path, {
      resource_type: 'image',
      folder: this.folder,
    });

    return {
      publicId: response.public_id,
      secureUrl: response.secure_url,
    };
  }
}
