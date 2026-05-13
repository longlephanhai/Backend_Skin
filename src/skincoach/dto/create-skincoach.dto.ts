import { Type } from 'class-transformer';
import {
  IsString, IsArray, IsObject, IsNotEmpty,
  IsNumber, IsOptional, ValidateNested, IsIn
} from 'class-validator';

class DailyTaskDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsIn(['morning', 'evening', 'anytime'])
  timeOfDay: string;

  @IsString()
  @IsIn(['cleanser', 'treatment', 'moisturizer', 'suncare', 'lifestyle', 'diet', 'assessment'])
  tag: string;

  @IsOptional()
  @IsString()
  frequency?: string;
}

class DailyRoutineDto {
  @IsNumber()
  day: number;

  @IsString()
  phase: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DailyTaskDto)
  tasks: DailyTaskDto[];

  @IsOptional()
  @IsString()
  note?: string;
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