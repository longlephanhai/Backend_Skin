import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryResponse } from './cloudinary/cloudinary-response';

const streamifier = require('streamifier');

@Injectable()
export class CloudinaryService {
    uploadFile(file: Express.Multer.File): Promise<CloudinaryResponse> {
        return new Promise((resolve, reject) => {
            const upload = cloudinary.uploader.upload_stream((error, result) => {
                if (error) return reject(error);
                resolve(result);
            });
            streamifier.createReadStream(file.buffer).pipe(upload);
        });
    }

    async uploadFiles(files: Express.Multer.File[]): Promise<CloudinaryResponse[]> {
        return Promise.all(files.map((file) => this.uploadFile(file)));
    }
}
