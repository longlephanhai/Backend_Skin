import { PartialType } from '@nestjs/mapped-types';
import { CreateDetectionDto } from './create-detection.dto';

export class UpdateDetectionDto extends PartialType(CreateDetectionDto) {}
