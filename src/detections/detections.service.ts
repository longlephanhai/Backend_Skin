import { Injectable } from '@nestjs/common';
import { CreateDetectionDto } from './dto/create-detection.dto';
import { UpdateDetectionDto } from './dto/update-detection.dto';
import { InjectModel } from 'node_modules/@nestjs/mongoose/dist';
import { Detection } from './schema/detection.schema';
import { Model } from 'mongoose';

@Injectable()
export class DetectionsService {

  constructor(@InjectModel(Detection.name) private detectionModel: Model<Detection>) { }

  create(createDetectionDto: CreateDetectionDto) {
    return 'This action adds a new detection';
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
