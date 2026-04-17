import {
    Controller,
    Post,
    UploadedFiles,
    UseInterceptors,
} from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { FileFieldsInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ResponseMessage } from 'src/decorator/customize';

@Controller('cloudinary')
export class CloudinaryController {
    constructor(private readonly cloudinaryService: CloudinaryService) { }

    @Post('uploads')
    
    @ResponseMessage('Upload Multiple Files')
    @UseInterceptors(FileFieldsInterceptor([
        { name: 'front', maxCount: 1 },
        { name: 'left', maxCount: 1 },
        { name: 'right', maxCount: 1 },
    ]))
    uploadFile(@UploadedFiles() files: { front?: Express.Multer.File[], left?: Express.Multer.File[], right?: Express.Multer.File[] }) {
        return this.cloudinaryService.uploadFiles([
            ...(files.front || []),
            ...(files.left || []),
            ...(files.right || []),
        ])
    }
}
