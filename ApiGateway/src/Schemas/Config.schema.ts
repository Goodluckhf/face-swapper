import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ConfigDocument = HydratedDocument<Config>;

@Schema()
export class Config {
    
    @Prop()
    groupids: number[]

    @Prop()
    textcaption: string;

    @Prop()
    textphoto: string
}

export const ConfigSchema = SchemaFactory.createForClass(Config);
