import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AiChatDocument = AiChat & Document;

@Schema()
export class Message {
  @Prop({ required: true, enum: ['user', 'ai', 'system'] })
  role: string;

  @Prop({ required: true })
  content: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}
export const MessageSchema = SchemaFactory.createForClass(Message);

@Schema({ timestamps: true })
export class AiChat {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  subject: string;

  @Prop({ required: true })
  chapter: string;

  @Prop({ required: true })
  topic: string;

  @Prop({ required: true })
  language: string;

  @Prop({ type: [MessageSchema], default: [] })
  messages: Message[];
}

export const AiChatSchema = SchemaFactory.createForClass(AiChat);
