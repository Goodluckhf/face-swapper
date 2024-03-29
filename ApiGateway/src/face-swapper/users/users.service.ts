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
    @InjectModel(Image.name) private ImageModel: Model<Image>,
  ) {}

  async getUser(id: string): Promise<UserDocument> {
    return this.UserModel.findOneAndUpdate(
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

  async setSubscription(id: string, groupIds?: number[]): Promise<Limit> {
    const user = await this.getUser(id);
    const config = await this.ConfigModel.findOne();

    const availableGroups = config.groupids.filter((id) => {
      return !user.subscribedGroups.includes(id);
    });

    if (!groupIds || !groupIds.length) {
      return this.getLimit(id);
    }

    const isAvailableInputGroups = groupIds.every((inputGroupId) => {
      return availableGroups.includes(inputGroupId);
    });

    if (!isAvailableInputGroups) {
      return this.getLimit(id);
    }

    user.subscribedGroups = [...user.subscribedGroups, ...groupIds];
    user.limit += 1;
    user.lastSubscription = new Date();
    await user.save();

    return this.getLimit(id);
  }

  async setLimit(
    id: string,
    limit: number,
    updateLastUsage = false,
  ): Promise<UserDocument> {
    const user = await this.getUser(id);
    user.limit += limit;
    if (updateLastUsage) {
      user.lastUsage = new Date();
    }
    await user.save();
    return user;
  }

  async getLimit(id: string): Promise<Limit> {
    const user = await this.getUser(id);
    const todayGenerated = user?.lastUsage?.getDate() === new Date().getDate();
    if (!todayGenerated && user.limit < 1) {
      user.limit += 1;
      await user.save();
    }

    const extraGenerationAvailable =
      user?.lastSubscription?.getDate() !== new Date().getDate();

    const config = await this.ConfigModel.findOne();
    const availableGroups = config.groupids.filter((id) => {
      return !user.subscribedGroups.includes(id);
    });
    const commonResult = {
      limit: user.limit,
      extraGenerationAvailable,
      groupIds: availableGroups,
    };
    if (user.limit <= 0) {
      const lastImage = await this.ImageModel.find({ creator: id })
        .sort({ createdAt: -1 })
        .limit(1);

      return {
        ...commonResult,
        result: lastImage[0]?.url,
        basePhoto: lastImage[0]?.basePhoto,
        textphoto: config?.textphoto,
        textcaption: config?.textcaption,
      };
    }

    return commonResult;
  }
}
