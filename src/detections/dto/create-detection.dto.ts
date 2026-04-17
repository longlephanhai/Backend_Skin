import { IsString, IsNumber, IsArray, IsObject, IsEnum, IsUUID, ValidateNested, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { SkinCondition } from 'src/types';
import mongoose from 'mongoose';

class DetailDetectionDto {
    @IsEnum(SkinCondition)
    label: SkinCondition;

    @IsNumber()
    confidence: number;

    @IsArray()
    @IsNumber({}, { each: true })
    bbox: number[];

    @IsString()
    crop_url: string;
}

class ViewResultDto {
    @IsNumber()
    total: number;

    @IsObject()
    stats: Record<string, number>;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => DetailDetectionDto)
    detections: DetailDetectionDto[];

    @IsString()
    visualization_url: string;
}

export class CreateDetectionDto {
    @IsNotEmpty()
    session_id: string;

    @IsNumber()
    total_acne: number;

    @IsObject()
    stats: Record<string, number>;

    @IsObject()
    @ValidateNested()
    @Type(() => ResultsDto)
    results: {
        front: ViewResultDto;
        left: ViewResultDto;
        right: ViewResultDto;
    };

    @IsString()
    @IsNotEmpty()
    userId: mongoose.Types.ObjectId;
}

class ResultsDto {
    @ValidateNested()
    @Type(() => ViewResultDto)
    front: ViewResultDto;

    @ValidateNested()
    @Type(() => ViewResultDto)
    left: ViewResultDto;

    @ValidateNested()
    @Type(() => ViewResultDto)
    right: ViewResultDto;
}