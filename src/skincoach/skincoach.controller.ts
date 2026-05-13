import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SkincoachService } from './skincoach.service';
import { CreateSkincoachDto } from './dto/create-skincoach.dto';
import { UpdateSkincoachDto } from './dto/update-skincoach.dto';
import { ResponseMessage, User } from 'src/decorator/customize';

@Controller('skincoach')
export class SkincoachController {
  constructor(private readonly skincoachService: SkincoachService) { }

  @Post()
  @ResponseMessage('Create skincoach successfully')
  create(@Body() createSkincoachDto: CreateSkincoachDto, @User() user: any) {
    console.log("Received CreateSkincoachDto:", createSkincoachDto);
    return this.skincoachService.create(createSkincoachDto, user);
  }

  @Get()
  findAll() {
    return this.skincoachService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.skincoachService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSkincoachDto: UpdateSkincoachDto) {
    return this.skincoachService.update(+id, updateSkincoachDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.skincoachService.remove(+id);
  }
}
