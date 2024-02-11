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
import { BasePhoto, Image } from '../Schemas/Image.schema';
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
    await this.userService.setLimit(id, -1, true);

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
          catchError(async (e) => {
            this.logger.error(`Ошибка генерации`, e);
            this.logger.error(e.response.data);
            await this.userService.setLimit(id, 1);
            throw new HttpException(e.response.data, e.response.status);
          }),
        ),
    );

    const image: Partial<Image> = { id: data.id, creator: id };
    const basePhotoSettings = this.getBasePhotoSettings(target);
    if (basePhotoSettings) {
      image.basePhoto = basePhotoSettings;
    }
    await this.ImageModel.create(image);
    return data;
  }

  getBasePhotoSettings(photoUrl: string): BasePhoto | null {
    const basePath = photoUrl.replace('base-images/', '');
    const match = basePath.match(
      /^(?<category>[a-z0-9\-]+)\/(?<sex>[a-z]+)\/(?<photoId>[a-zA-Z0-9\-]+)\.(?<extension>[a-z]+)$/,
    );
    if (!match) {
      return null;
    }

    return {
      photoId: match.groups.photoId,
      sex: match.groups.sex,
      category: match.groups.category,
      extension: match.groups.extension,
    };
  }

  async getResult(id: string): Promise<Result | 'PENDING'> {
    const image = await this.ImageModel.findOne({ id });
    if (!image) {
      throw new HttpException('Image not found', HttpStatus.NOT_FOUND);
    }

    const { limit } = await this.userService.getLimit(image.creator);
    if (limit < 0) {
      throw new ForbiddenException();
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
        result: data.image,
        basePhoto: image.basePhoto,
        textphoto: config.textphoto,
        textcaption: config.textcaption,
      };
    }

    return 'PENDING';
  }
}
