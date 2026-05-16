import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TimetableDocument = Timetable & Document;

@Schema()
export class StudyPlan {
  @Prop({ required: true })
  date: Date;

  @Prop({ required: true })
  subject: string;

  @Prop({ required: true })
  chapter: string;

  @Prop({ required: true })
  topic: string;

  @Prop({ required: true })
  startTime: string;

  @Prop({ required: true })
  endTime: string;

  @Prop({ default: false })
  completed: boolean;
}
export const StudyPlanSchema = SchemaFactory.createForClass(StudyPlan);

@Schema({ timestamps: true })
export class Timetable {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: [StudyPlanSchema], default: [] })
  studyPlan: StudyPlan[];

  @Prop({ default: 0 })
  progress: number;

  @Prop({ default: Date.now })
  generatedAt: Date;
}

export const TimetableSchema = SchemaFactory.createForClass(Timetable);
