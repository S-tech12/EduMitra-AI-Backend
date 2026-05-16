import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SubjectDocument = Subject & Document;

@Schema()
export class Topic {
  @Prop({ required: true })
  topicName: string;
}
export const TopicSchema = SchemaFactory.createForClass(Topic);

@Schema()
export class Chapter {
  @Prop({ required: true })
  chapterNumber: number;

  @Prop({ required: true })
  chapterName: string;

  @Prop({ type: [TopicSchema], default: [] })
  topics: Topic[];
}
export const ChapterSchema = SchemaFactory.createForClass(Chapter);

@Schema({ timestamps: true })
export class Subject {
  @Prop({ required: true })
  standard: string;

  @Prop({ required: true })
  subjectName: string;

  @Prop({ type: [ChapterSchema], default: [] })
  chapters: Chapter[];
}

export const SubjectSchema = SchemaFactory.createForClass(Subject);
