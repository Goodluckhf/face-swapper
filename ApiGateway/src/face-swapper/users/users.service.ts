import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Image } from '../../Schemas/Image.schema';
import { User, UserDocument } from '../../Schemas/User.schema';
import { Config } from '../../Schemas/Config.schema';
import { Limit } from './users.models';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private UserModel: Model<User>,
    @InjectModel(Config.name) private ConfigModel: Model<Config>,
    @InjectModel(Image.name) private ImageModel: Model<Image>
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
        populate: ['images'],
      },
    );
  }
  
  async setSubscription(id: string): Promise<Limit> {
    const user = await this.getUser(id);
    if(user?.lastSubscription?.getDate() !== new Date().getDate()){
      user.lastSubscription = new Date()
      user.limit += 1
      await user.save()      
    }

    const limit = await this.getLimit(id)
    return limit
  }

  async setLimit(id: string, limit: number): Promise<UserDocument>{
    const user = await this.getUser(id);
    user.limit += limit
    await user.save()
    return user
  }

  async getLimit(id: string): Promise<Limit> {

    const user = await this.getUser(id);
    const images = await this.todayGenerations(id);
    const todaySubscription = user?.lastSubscription?.getDate() == new Date().getDate();
    const extraGenerationAvailable = !todaySubscription && user.limit < 2;    

    if (user.limit <= 0) {
      const lastImage = images[images.length - 1];
      const config = await this.ConfigModel.findOne();

      return {
        limit: user.limit,
        result: lastImage?.url,
        textphoto: config?.textphoto,
        textcaption: config?.textcaption,
      };
    }

    return { limit: user.limit, extraGenerationAvailable };
  }

  async todayGenerations(id: string): Promise<Image[]> {
    const images = await this.ImageModel.find({id})
    return images.filter(
      (image) => image.createdAt.getDate() == new Date().getDate() && image.url,
    );
  }
}
