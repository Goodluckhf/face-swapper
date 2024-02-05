import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ConfigDocument = HydratedDocument<Config>;

export interface VkAppsSettings {
  vkSecretKey: string;
}

@Schema()
export class Config {
  @Prop()
  groupids: number[];

  @Prop()
  textcaption: string;

  @Prop()
  textphoto: string;

  @Prop({ type: Object })
  vkApps: Record<string, VkAppsSettings>;
}

export const ConfigSchema = SchemaFactory.createForClass(Config);
