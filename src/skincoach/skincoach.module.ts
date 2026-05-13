import { Module } from '@nestjs/common';
import { SkincoachService } from './skincoach.service';
import { SkincoachController } from './skincoach.controller';
import { MongooseModule } from 'node_modules/@nestjs/mongoose/dist';
import { SkinCoach, SkinCoachSchema } from './schema/skincoach.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: SkinCoach.name, schema: SkinCoachSchema }])],
  controllers: [SkincoachController],
  providers: [SkincoachService],
})
export class SkincoachModule { }
