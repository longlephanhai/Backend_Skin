import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SkinCoachDocument = HydratedDocument<SkinCoach>;

@Schema({ _id: false })
class DailyTask {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  timeOfDay: string;

  @Prop({ required: true })
  tag: string;

  @Prop({ required: false })
  frequency?: string;
}

@Schema({ _id: false })
class DailyRoutine {
  @Prop({ required: true })
  day: number;

  @Prop({ required: true })
  phase: string;

  @Prop({ type: [DailyTask], required: true })
  tasks: DailyTask[];

  @Prop({ required: false })
  note?: string;
}

@Schema({ timestamps: true })
export class SkinCoach {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: string;

  @Prop({ required: true })
  sessionId: string;

  @Prop({ default: false })
  shouldSeeDoctor: boolean;

  @Prop()
  medicalWarning: string;

  @Prop({ type: Object })
  inputSurvey: any;

  @Prop({ type: Array })
  detectedIssues: string[];

  @Prop()
  severityScore: number;

  @Prop()
  rootCause: string;

  @Prop()
  analysis: string;

  @Prop({ type: [DailyRoutine], default: [] })
  routine30Days: DailyRoutine[];

  @Prop({ default: 7 })
  nextCheckupDays: number;

  @Prop({ type: Map, of: Boolean, default: {} })
  dayCompletionStatus: Map<number, boolean>; 

  @Prop({ default: 1 })
  currentDay: number;

  @Prop({ default: false })
  isCompleted: boolean;
}

export const SkinCoachSchema = SchemaFactory.createForClass(SkinCoach);