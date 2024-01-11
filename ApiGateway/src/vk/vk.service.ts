import { Injectable } from '@nestjs/common';
import UploadDto from './dtos/Upload.dto';
import { HttpService } from '@nestjs/axios';
import { MinioService } from 'src/face-swapper/minio/minio.service';
import { randomUUID } from 'crypto';
import internal from 'stream';

@Injectable()
export class VkService {
  constructor(
    private readonly httpService: HttpService,
    private readonly minioService: MinioService,
  ) {}

  async streamToBlob(stream: internal.Readable): Promise<Blob> {
    const mimeType = stream['headers']['content-type'];

    return new Promise((resolve, reject) => {
      const chunks = [];
      stream
        .on('data', (chunk) => chunks.push(chunk))
        .once('end', () => {
          const blob =
            mimeType != null
              ? new Blob(chunks, { type: mimeType })
              : new Blob(chunks);
          resolve(blob);
        })
        .once('error', reject);
    });
  }

  async uploadFile(file: UploadDto) {
    const { photo, uploadUrl } = file;
    const stream = await this.minioService.getFile(photo);
    const blob = await this.streamToBlob(stream);
    const form = new FormData();
    form.set('photo', blob, `${randomUUID()}.png`);
    const { data } = await this.httpService.post(uploadUrl, form).toPromise();
    return data;
  }
}
