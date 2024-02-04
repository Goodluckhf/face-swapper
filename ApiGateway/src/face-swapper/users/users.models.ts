import { BasePhoto } from '../../Schemas/Image.schema';

export interface Limit {
  limit: number;
  extraGenerationAvailable?: boolean;
  result?: string;
  basePhoto?: BasePhoto;
  textphoto?: string;
  textcaption?: string;
}
