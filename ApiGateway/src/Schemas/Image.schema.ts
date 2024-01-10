import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, mongo } from 'mongoose';
import { User } from './User.schema';

export type ImageDocument = HydratedDocument<Image>;

@Schema({ timestamps: true })
export class Image {
  @Prop()
  id: string;

  @Prop()
  url: string;

  @Prop()
  creator: string;

  @Prop()
  createdAt: Date;
}

export const ImageSchema = SchemaFactory.createForClass(Image);
