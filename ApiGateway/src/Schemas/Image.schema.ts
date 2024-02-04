import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ImageDocument = HydratedDocument<Image>;

export interface BasePhoto {
  category: string;
  sex: string;
  photoId: string;
  extension: string;
}

@Schema({ timestamps: true })
export class Image {
  @Prop()
  id: string;

  @Prop()
  url: string;

  @Prop(
    raw({
      category: { type: String },
      sex: { type: String },
      photoId: { type: String },
      extension: { type: String },
    }),
  )
  basePhoto: BasePhoto;

  @Prop()
  creator: string;

  @Prop()
  createdAt: Date;
}

export const ImageSchema = SchemaFactory.createForClass(Image);
