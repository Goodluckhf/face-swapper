import { BasePhoto } from '../Schemas/Image.schema';

export type JobStatus = 'FAILURE' | 'PENDING' | 'SUCCESS';

export interface JobResult {
  id: string;
  status: JobStatus;
  image?: string;
  error?: string;
}

export interface Result {
  groupids: number[];
  gr: string;
  result: string;
  basePhoto: BasePhoto;
  textphoto: string;
  textcaption: string;
}
