import { Module } from '@nestjs/common';
import { DetectionsService } from './detections.service';
import { DetectionsController } from './detections.controller';
import { MongooseModule } from 'node_modules/@nestjs/mongoose/dist';
import { Detection, DetectionSchema } from './schema/detection.schema';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';

@Module({
  imports: [
    CloudinaryModule,
    MongooseModule.forFeature([{ name: Detection.name, schema: DetectionSchema }])
  ],
  controllers: [DetectionsController],
  providers: [DetectionsService],
})
export class DetectionsModule { }
