export type JobStatus = 'SENT' | 'FAILURE' | 'PENDING' | 'SUCCESS';
export interface JobResult {
  id: string;
  status: JobStatus;
  image?: string;
  error?: string;
}
