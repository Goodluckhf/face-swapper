import { HttpService } from '@nestjs/axios';
import { HttpException, Injectable } from '@nestjs/common';
import { JobResult } from './face-swapper.models';
import { catchError, firstValueFrom } from 'rxjs';
import { Blob } from 'buffer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FaceSwapperService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async swapFace(
    file: Express.Multer.File,
    target: string,
  ): Promise<Pick<JobResult, 'id'>> {
    const form = new FormData();
    form.append(
      'source',
      new Blob([file.buffer], { type: file.mimetype }),
      file.originalname,
    );
    form.append('target', target);

    const result = await firstValueFrom(
      this.httpService
        .post<Pick<JobResult, 'id'>>(this.configService.get('API'), form, {
          headers: { 'content-type': 'multipart/form-data' },
        })
        .pipe(
          catchError((e) => {
            throw new HttpException(e.response.data, e.response.status);
          }),
        ),
    );

    return result.data;
  }

  async getResult(id: string): Promise<JobResult> {
    const result = await firstValueFrom(
      this.httpService
        .get<JobResult>(`${this.configService.get('API')}/${id}`)
        .pipe(
          catchError((e) => {
            throw new HttpException(e.response.data, e.response.status);
          }),
        ),
    );

    return result.data;
  }
}
