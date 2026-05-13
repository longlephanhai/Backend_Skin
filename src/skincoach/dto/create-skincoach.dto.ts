import { Type } from 'class-transformer';
import {
  IsString, IsArray, IsObject, IsNotEmpty,
  IsNumber, IsOptional, ValidateNested, IsIn
} from 'class-validator';

class SkinTaskDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsIn(['morning', 'evening', 'weekly', 'anytime'])
  timeOfDay: string;

  @IsString()
  @IsIn(['cleanser', 'treatment', 'moisturizer', 'suncare', 'lifestyle', 'diet', 'assessment'])
  tag: string;

  @IsString()
  @IsNotEmpty()
  frequency: string;
}

class ActionPlanDto {
  @IsNumber()
  week: number;

  @IsString()
  focus: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SkinTaskDto)
  tasks: SkinTaskDto[];
}

export class CreateSkincoachDto {
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @IsObject()
  @IsNotEmpty()
  survey: {
    skinType: string;
    sensitive: string;
    hasPain: string;
    sunscreen: string;
    sleepHabit: string;
    treatments: string[];
    lifestyleFactor: string[];
    waterIntake: string;
    allergy: string[];
    priority: string;
  };

  @IsArray()
  @IsNotEmpty()
  finalDetections: Array<{
    label: string;
    confidence: number;
    isManual: boolean;
    [key: string]: any;
  }>;

  @IsNumber()
  @IsOptional()
  total_acne?: number;

  @IsObject()
  @IsOptional()
  stats?: Record<string, number>;
}