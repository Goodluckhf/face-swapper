import { HttpService } from '@nestjs/axios';
import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { JobResult, Result } from './face-swapper.models';
import { catchError, firstValueFrom } from 'rxjs';
import { Blob } from 'buffer';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Image } from '../Schemas/Image.schema';
import { Config } from '../Schemas/Config.schema';
import { UsersService } from './users/users.service';
import { randomUUID } from 'crypto';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class FaceSwapperService {
  constructor(
    @InjectModel(Image.name) private ImageModel: Model<Image>,
    @InjectModel(Config.name) private ConfigModel: Model<Config>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly userService: UsersService,
    private readonly logger: PinoLogger,
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
    await this.userService.setLimit(id, -1);

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
            this.logger.error(`Ошибка генерации`, e);
            this.logger.error(e.response.data);
            throw new HttpException(e.response.data, e.response.status);
          }),
        ),
    );

    await this.ImageModel.create({ id: data.id, creator: id });
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
            this.logger.error(`Ошибка генерации`, e);
            this.logger.error(e.response.data);
            await this.userService.setLimit(image.creator, 1);
            throw new HttpException(e.response.data, e.response.status);
          }),
        ),
    );

    if (data.status == 'SUCCESS') {
      this.logger.info(`Успешно сгенерировано: ${data.image}`);

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
