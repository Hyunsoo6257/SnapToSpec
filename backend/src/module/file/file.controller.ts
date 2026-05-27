import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { memoryStorage } from 'multer';

import { UploadResultDto } from './dto/upload-result.dto';
import { FileService } from './file.service';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

@ApiTags('File')
@Controller('file')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'Only JPEG, PNG, and WebP images are allowed',
            ),
            false,
          );
        }
      },
    }),
  )
  uploadScreenshot(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UploadResultDto> {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    return this.fileService.uploadScreenshot(file);
  }
}
