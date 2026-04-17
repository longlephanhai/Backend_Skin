import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { DetectionsService } from './detections.service';
import { CreateDetectionDto } from './dto/create-detection.dto';
import { UpdateDetectionDto } from './dto/update-detection.dto';
import { ResponseMessage, User } from 'src/decorator/customize';
import { FileFieldsInterceptor } from 'node_modules/@nestjs/platform-express';
import { IUser } from 'src/types';


@Controller('detections')
export class DetectionsController {
  constructor(private readonly detectionsService: DetectionsService) { }

  @Post('uploads')
  @ResponseMessage('Detection Successfully')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'front', maxCount: 1 },
    { name: 'left', maxCount: 1 },
    { name: 'right', maxCount: 1 },
  ]))
  detectFiles(@UploadedFiles() files: { front?: Express.Multer.File[], left?: Express.Multer.File[], right?: Express.Multer.File[] }, @User() user: any) {
    return this.detectionsService.create({
      front: files.front || [],
      left: files.left || [],
      right: files.right || [],
    }, user)
  }

  // @Post()
  // create(@Body() createDetectionDto: CreateDetectionDto) {
  //   return this.detectionsService.create(createDetectionDto);
  // }

  // @Get()
  // findAll() {
  //   return this.detectionsService.findAll();
  // }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.detectionsService.findOne(+id);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateDetectionDto: UpdateDetectionDto) {
  //   return this.detectionsService.update(+id, updateDetectionDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.detectionsService.remove(+id);
  // }
}
