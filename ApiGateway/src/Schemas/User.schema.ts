import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { Image } from './Image.schema';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop()
  id: string;

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Image' }],
  })
  images: Image[];

  @Prop({
    type: [Number],
    default: [],
  })
  subscribedGroups: number[];

  @Prop({
    default: 1,
  })
  limit: number;

  @Prop({
    default: () => new Date(),
  })
  lastUsage: Date;

  @Prop()
  lastSubscription: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
