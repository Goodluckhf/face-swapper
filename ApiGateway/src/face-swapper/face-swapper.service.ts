import { HttpService } from '@nestjs/axios';
import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { JobResult, JobStatus, Result } from './face-swapper.models';
import { NotFoundError, catchError, firstValueFrom } from 'rxjs';
import { Blob } from 'buffer';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Image } from '../Schemas/Image.schema';
import { Config } from '../Schemas/Config.schema';
import { UsersService } from './users/users.service';
import { randomUUID } from 'crypto';

@Injectable()
export class FaceSwapperService implements OnModuleInit {
  constructor(
    @InjectModel(Image.name) private ImageModel: Model<Image>,
    @InjectModel(Config.name) private ConfigModel: Model<Config>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly userService: UsersService,
  ) {}

  async swapFace(
    id: string,
    file: Express.Multer.File,
    target: string,
  ): Promise<Pick<JobResult, 'id'>> {

    const { limit } = await this.userService.getLimit(id);

    if (limit <= 0) {
      throw new ForbiddenException();
    }

    const fileName: string = `${randomUUID()}.${file.mimetype.split('/')[1]}`;
    const form = new FormData();
    form.set(
      'source',
      new Blob([file.buffer], { type: file.mimetype }),
      fileName,
    );
    form.set('target', target);

    const { data } = await firstValueFrom(
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

    const image = await this.ImageModel.create({ id: data.id });
    await this.userService.saveImage(id, image);
    return data;
  }

  async getResult(id: string): Promise<Result | 'PENDING'> {
    const image = await this.ImageModel.findOne({ id });

    if (!image) {
      throw new HttpException('Image not found', HttpStatus.NOT_FOUND);
    }

    const { data } = await firstValueFrom(
      this.httpService
        .get<JobResult>(`${this.configService.get('API')}/${id}`)
        .pipe(
          catchError(async (e) => {
            await image.deleteOne();
            throw new HttpException(e.response.data, e.response.status);
          }),
        ),
    );

    if (data.status == 'SUCCESS') {
      const config = await this.ConfigModel.findOne();

      image.url = data.image;
      await image.save();

      return {
        groupids: config.groupids,
        gr: `https://vk.com/app/${this.configService.get('MINI_APP_ID')}`,
        result: data.image,
        textphoto: config.textphoto,
        textcaption: config.textcaption,
      };
    }

    return 'PENDING';
  }
}
