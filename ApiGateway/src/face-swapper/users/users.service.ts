import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Image, ImageDocument } from '../../Schemas/Image.schema';
import { User, UserDocument } from '../../Schemas/User.schema';
import { Config } from '../../Schemas/Config.schema';
import { Limit } from './users.models';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private UserModel: Model<User>,
    @InjectModel(Config.name) private ConfigModel: Model<Config>,
  ) {}

  async getUser(id: string): Promise<UserDocument> {
    return await this.UserModel.findOneAndUpdate(
      {
        id,
      },
      {
        $setOnInsert: { id },
      },
      {
        returnOriginal: false,
        upsert: true,
        populate: ['images']
      },
    )
  }

  async getLimit(id: string): Promise<Limit> {
    const maxPerDay = 1;
    const user = await this.getUser(id);
    const images = await this.todayGenerations(id);
    const todaySubscription =
      user?.lastSubscription?.getDate() == new Date().getDate();
    const limit = maxPerDay + (todaySubscription ? 1 : 0) - images.length;
    const extraGenerationAvailable = !todaySubscription && limit < 2;

    if (limit <= 0) {
      const lastImage = images[images.length - 1];
      const config = await this.ConfigModel.findOne();

      return {
        limit: 0,
        result: lastImage.url,
        textphoto: config.textphoto,
        textcaption: config.textcaption,
      };
    }

    return { limit, extraGenerationAvailable };
  }

  async setUser(id: string): Promise<void> {
    await this.UserModel.updateOne(
      { id },
      {
        lastSubscription: new Date(),
      },
      {
        upsert: true
      }
    );
  }

  async saveImage(id: string, image: ImageDocument): Promise<void> {
    await this.UserModel.updateOne(
      { id },
      {
        $push: {
          images: image,
        },
      },
    );
  }

  async todayGenerations(id: string): Promise<Image[]> {
    const user = await this.getUser(id);
    return user.images.filter(
      (image) => image.createdAt.getDate() == new Date().getDate() && image.url,
    );
  }
}
