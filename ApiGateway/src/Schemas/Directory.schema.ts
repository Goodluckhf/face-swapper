import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type DirectoryDocument = HydratedDocument<Directory>;

@Schema()
export class Directory {
    @Prop()
    name: string;

    @Prop()
    path: string

    @Prop({enum: ['male', 'female']})
    sex: string
}

export const DirectorySchema = SchemaFactory.createForClass(Directory);
