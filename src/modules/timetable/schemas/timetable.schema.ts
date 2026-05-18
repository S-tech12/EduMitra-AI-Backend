import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TimetableDocument = Timetable & Document;

@Schema({ _id: false })
export class SchoolTiming {
  @Prop({ required: true })
  hasSchool: string;

  @Prop()
  schoolStartTime?: string;

  @Prop()
  schoolEndTime?: string;
}

@Schema({ _id: false })
export class SubjectSchedule {
  @Prop({ required: true })
  subject: string;

  @Prop({ required: true })
  date: string;

  @Prop({ required: true })
  time: string;

  @Prop({ type: [String], required: true })
  selectedChapters: string[];
}

@Schema({ _id: false })
export class TimetableTask {
  @Prop({ required: true })
  subject: string;

  @Prop({ required: true })
  chapter: string;

  @Prop({ required: true })
  time: string;

  @Prop({ required: true, enum: ['Learning', 'Revision', 'Exam'] })
  type: string;

  @Prop({ default: false })
  completed: boolean;
}

@Schema({ _id: false })
export class TimetableDay {
  @Prop({ required: true })
  date: string;

  @Prop({ required: true })
  day: string;

  @Prop({ type: [TimetableTask], default: [] })
  tasks: TimetableTask[];
}

@Schema({ timestamps: true })
export class Timetable {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  timetableName: string;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop()
  nearestExamDate?: Date;

  @Prop({ type: [SubjectSchedule], required: true })
  subjects: SubjectSchedule[];

  @Prop({ required: true })
  dailyStudyHours: number;

  @Prop({ type: SchoolTiming, required: true })
  schoolTiming: SchoolTiming;

  @Prop({ type: [TimetableDay], required: true })
  generatedTimetable: TimetableDay[];

  @Prop({ type: [String], default: [] })
  tips: string[];

  @Prop({ type: [String], default: [] })
  suggestions: string[];

  @Prop()
  motivationalQuote?: string;

  @Prop({ default: Date.now })
  generatedAt: Date;
}

export const TimetableSchema = SchemaFactory.createForClass(Timetable);
