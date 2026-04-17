import { Injectable } from '@nestjs/common';
import { CreateDetectionDto } from './dto/create-detection.dto';
import { UpdateDetectionDto } from './dto/update-detection.dto';
import { InjectModel } from 'node_modules/@nestjs/mongoose/dist';
import { Detection } from './schema/detection.schema';
import { Model } from 'mongoose';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { ConfigService } from 'node_modules/@nestjs/config';
import axios from 'node_modules/axios';
import { IUser } from 'src/types';

@Injectable()
export class DetectionsService {

  constructor(
    @InjectModel(Detection.name) private detectionModel: Model<Detection>,
    private readonly cloudinaryService: CloudinaryService,
    private readonly configService: ConfigService
  ) { }

  async create(files: {
    front: Express.Multer.File[],
    left: Express.Multer.File[],
    right: Express.Multer.File[]
  }, user: any) {
    const uploadResults = await this.cloudinaryService.uploadFiles(files);
    const front_url = uploadResults[0]?.url || '';
    const left_url = uploadResults[1]?.url || '';
    const right_url = uploadResults[2]?.url || '';

    const aiBaseUrl = this.configService.get('API_AI');
    const response = await axios.post(
      aiBaseUrl + '/detect',
      {
        front: front_url,
        left: left_url,
        right: right_url
      }
    );

    const AIData = response.data;

    const sides = ['front', 'left', 'right'] as const;
    for (const side of sides) {
      if (AIData.results[side]) {
        if (AIData.results[side].visualization_url) {
          AIData.results[side].visualization_url = `${aiBaseUrl}${AIData.results[side].visualization_url}`;
        }

        if (AIData.results[side].detections) {
          AIData.results[side].detections.forEach((det: any) => {
            if (det.crop_url) {
              det.crop_url = `${aiBaseUrl}${det.crop_url}`;
            }
          });
        }
      }
    }

    const finalResult = await this.detectionModel.create({
      user: user.userId,
      session_id: AIData.session_id,
      total_acne: AIData.total_acne,
      stats: AIData.stats,
      results: AIData.results,
      original_images: {
        front: front_url,
        left: left_url,
        right: right_url
      }
    });

    return finalResult;
  }

  findAll() {
    return `This action returns all detections`;
  }

  findOne(id: number) {
    return `This action returns a #${id} detection`;
  }

  update(id: number, updateDetectionDto: UpdateDetectionDto) {
    return `This action updates a #${id} detection`;
  }

  remove(id: number) {
    return `This action removes a #${id} detection`;
  }
}
