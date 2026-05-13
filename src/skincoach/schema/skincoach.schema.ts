import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SkinCoachDocument = HydratedDocument<SkinCoach>;

@Schema({ _id: false })
class SkinTask {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: ['morning', 'evening', 'weekly', 'anytime'] })
  timeOfDay: string;

  @Prop({ required: true, enum: ['cleanser', 'treatment', 'moisturizer', 'suncare', 'lifestyle', 'diet', 'assessment'] })
  tag: string;

  @Prop({ required: true })
  frequency: string;
}

@Schema({ _id: false })
class ActionPlan {
  @Prop({ required: true })
  week: number;

  @Prop({ required: true })
  focus: string;

  @Prop({ type: [SkinTask], default: [] })
  tasks: SkinTask[];
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

  @Prop({ type: [ActionPlan] })
  timeline: ActionPlan[];

  @Prop({ default: 7 })
  nextCheckupDays: number;

  @Prop()
  isCompleted: boolean;
}

export const SkinCoachSchema = SchemaFactory.createForClass(SkinCoach);