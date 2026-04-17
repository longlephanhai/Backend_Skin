import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { MulterModuleOptions, MulterOptionsFactory } from "@nestjs/platform-express";
import fs from 'fs';
import { diskStorage } from "multer";
import path, { join } from "path";

@Injectable()
export class MulterConfigService implements MulterOptionsFactory {

    getRootPath = () => {
        return process.cwd();
    };

    ensureExists(targetDirectory: string) {
        if (!fs.existsSync(targetDirectory)) {
            try {
                fs.mkdirSync(targetDirectory, { recursive: true });
                console.log(`[Multer] Directory created: ${targetDirectory}`);
            } catch (error) {
                console.error(error);
            }
        }
    }

    createMulterOptions(): MulterModuleOptions {
        return {
            storage: diskStorage({
                destination: (req, file, cb) => {
                 
                    const folder = (req?.headers?.folder_type as string) ?? "default";

                    const finalPath = join(this.getRootPath(), "public", "images", folder);

    
                    this.ensureExists(finalPath);

                    cb(null, finalPath);
                },
                filename: (req, file, cb) => {
                    // Lấy đuôi file (ví dụ: .jpeg)
                    const extName = path.extname(file.originalname);

                    // Lấy tên file gốc không kèm đuôi
                    const baseName = path.basename(file.originalname, extName);

                    // Tạo tên file duy nhất kèm timestamp để tránh ghi đè
                    const finalName = `${baseName}-${Date.now()}${extName}`;
                    cb(null, finalName);
                },
            }),
            fileFilter: (req, file, cb) => {
                const allowedFileTypes = ['jpg', 'jpeg', 'png', 'gif'];

                
                const fileExtension = file.originalname
                    ? file.originalname.split('.').pop()?.toLowerCase() || ''
                    : '';

                const isValidFileType = allowedFileTypes.includes(fileExtension);

                if (!isValidFileType) {
                    cb(new HttpException(
                        `Invalid file type. Only ${allowedFileTypes.join(', ')} are allowed.`,
                        HttpStatus.UNPROCESSABLE_ENTITY
                    ), false);
                } else {
                    cb(null, true);
                }
            },
            limits: {
              
                fileSize: 1024 * 1024 * 5
            }
        };
    }
}