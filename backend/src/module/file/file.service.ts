import { Inject, Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

import { UploadResultDto } from './dto/upload-result.dto';
import { IStorageService, STORAGE_SERVICE } from './storage/storage.interface';

@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);

  constructor(
    @Inject(STORAGE_SERVICE) private readonly storageService: IStorageService,
  ) {}

  async uploadScreenshot(file: Express.Multer.File): Promise<UploadResultDto> {
    const ext = file.originalname.split('.').pop() ?? 'png';
    const key = `screenshots/${uuidv4()}.${ext}`;

    this.logger.log(`Uploading screenshot: ${key}`);
    const imageUrl = await this.storageService.upload(
      file.buffer,
      key,
      file.mimetype,
    );

    return new UploadResultDto({ imageUrl });
  }
}
