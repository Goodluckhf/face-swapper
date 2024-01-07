import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { Image } from './Image.schema';

export type UserDocument = HydratedDocument<User>;

@Schema()
export class User {
    @Prop()
    id: string;

    @Prop({
        type: [{type: mongoose.Schema.Types.ObjectId, ref: 'Image'}]
    })
    images: Image[]
    
    @Prop()
    lastSubscription: Date
}

export const UserSchema = SchemaFactory.createForClass(User);
