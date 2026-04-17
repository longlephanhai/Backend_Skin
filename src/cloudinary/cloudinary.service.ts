import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from 'node_modules/@nestjs/config';
import { CloudinaryResponse, ICloudinaryRender } from 'src/types';


const streamifier = require('streamifier');


@Injectable()
export class CloudinaryService {

    constructor(
        private readonly configService: ConfigService
    ) { }

    async uploadFile(file: Express.Multer.File): Promise<ICloudinaryRender> {
        const result = await new Promise<CloudinaryResponse>((resolve, reject) => {
            const upload = cloudinary.uploader.upload_stream((error, result) => {
                if (error) return reject(error);
                resolve(result);
            });
            streamifier.createReadStream(file.buffer).pipe(upload);
        });
        return {
            url: result.secure_url,
            public_id: result.public_id
        };
    }

    async uploadFiles(files: {
        front: Express.Multer.File[],
        left: Express.Multer.File[],
        right: Express.Multer.File[]
    }): Promise<ICloudinaryRender[]> {
        const [frontRes, leftRes, rightRes] = await Promise.all([
            this.uploadFile(files.front[0]),
            this.uploadFile(files.left[0]),
            this.uploadFile(files.right[0]),
        ]);

        return [frontRes, leftRes, rightRes];
    }

    async uploadFromUrl(fileUrl: string, folder: string = 'results'): Promise<ICloudinaryRender> {
        try {

            const fullUrl = `${this.configService.get('API_AI')}${fileUrl}`;

            const result = await cloudinary.uploader.upload(fullUrl, {
                folder: `skin-detect/${folder}`,
            });

            return {
                url: result.secure_url,
                public_id: result.public_id
            };
        } catch (error) {
            console.error('Error uploading result image:', error);
            throw error;
        }
    }
}
