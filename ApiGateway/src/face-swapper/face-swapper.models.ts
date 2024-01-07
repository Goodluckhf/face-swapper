export type JobStatus = 'FAILURE' | 'PENDING' | 'SUCCESS';

export interface JobResult {
  id: string;
  status: JobStatus;
  image?: string;
  error?: string;
}

export interface Result {
  groupids: number[],
  gr: string,
  result: string,
  textphoto: string,
  textcaption: string
}
