import { Controller, Post, UseInterceptors, UseFilters, UploadedFiles, BadRequestException } from '@nestjs/common';
import { FilesService } from './files.service';
import { Public, ResponseMessage } from 'src/decorator/customize';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { HttpExceptionFilter } from 'src/core/http-exception.filter';
import { ConfigService } from 'node_modules/@nestjs/config';


@Controller('files')
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly configService: ConfigService
  ) { }

  @Public()
  @Post('upload')
  @ResponseMessage("Upload Files")
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'front', maxCount: 1 },
    { name: 'left', maxCount: 1 },
    { name: 'right', maxCount: 1 },
  ]))
  @UseFilters(new HttpExceptionFilter())
  uploadFile(@UploadedFiles() files: {
    front?: Express.Multer.File[],
    left?: Express.Multer.File[],
    right?: Express.Multer.File[]
  }) {
    if (!files || !files.front || !files.left || !files.right) {
      throw new BadRequestException('Vui lòng gửi đủ 3 ảnh với tên field là: front, left, right');
    }
    const getFileData = (fileArray: Express.Multer.File[]) => {
      const file = fileArray[0];
      return {
        filename: file.filename,
        path: `/images/default/${file.filename}`,
        url: `${this.configService.get('BACKEND_URL')}/images/default/${file.filename}`
      };
    };
    return {
      statusCode: 201,
      message: 'Upload Single File',
      data: {
        front: getFileData(files.front),
        left: getFileData(files.left),
        right: getFileData(files.right),
      }
    };
  }
}
