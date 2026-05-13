import { PartialType } from '@nestjs/mapped-types';
import { CreateSkincoachDto } from './create-skincoach.dto';

export class UpdateSkincoachDto extends PartialType(CreateSkincoachDto) {}
