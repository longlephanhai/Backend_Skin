import {
    Controller,
    Post,
    UploadedFile,
    UploadedFiles,
    UseFilters,
    UseInterceptors,
} from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { ResponseMessage } from 'src/decorator/customize';
import { HttpExceptionFilter } from 'src/core/http-exception.filter';

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
        return this.cloudinaryService.uploadFiles({
            front: files.front || [],
            left: files.left || [],
            right: files.right || [],
        });
    }

    @Post('upload-product')
    @ResponseMessage('Upload File Successfully')
    @UseFilters(new HttpExceptionFilter())
    @UseInterceptors(FileInterceptor('file'))
    uploadImgProduct(@UploadedFile() file: Express.Multer.File) {
        return this.cloudinaryService.uploadFile(file);
    }

}
