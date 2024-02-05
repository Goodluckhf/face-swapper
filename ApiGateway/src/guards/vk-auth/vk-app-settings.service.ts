import { Injectable } from '@nestjs/common';
import { Request } from 'express';
import { InjectModel } from '@nestjs/mongoose';
import { Config } from '../../Schemas/Config.schema';
import { Model } from 'mongoose';
import { VkAppSettingsInterface } from './vk-app-settings.interface';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class VkAppSettingsService {
  constructor(
    @InjectModel(Config.name) private ConfigModel: Model<Config>,
    private readonly logger: PinoLogger,
  ) {}

  public getUser(request: Request): string | null {
    const authorization = request.headers['authorization'];
    if (!authorization) return null;

    const token = authorization
      .split('&')
      .find((item) => /vk_user_id/.test(item));
    if (token) {
      return token.split('=')[1];
    }
    return null;
  }

  public getAppId(request: Request): string | null {
    const authorization = request.headers['authorization'];
    if (!authorization) return null;

    const token = authorization
      .split('&')
      .find((item) => /vk_app_id/.test(item));
    if (token) {
      return token.split('=')[1];
    }
    return null;
  }

  public async getAppSettings(
    req: Request,
  ): Promise<VkAppSettingsInterface | null> {
    const user = this.getUser(req);
    const vkMiniAppId = this.getAppId(req);
    if (!user || !vkMiniAppId) {
      this.logger.error(
        `VkRequestAuthGuard There is no userId or vkAppId in auth headers vkAppId:${vkMiniAppId} userId: ${user}`,
      );
      return null;
    }

    const { vkApps } = await this.ConfigModel.findOne();

    const secretKey = vkApps?.[vkMiniAppId]?.vkSecretKey;
    if (!secretKey) {
      this.logger.error(
        `VkRequestAuthGuard there is no secretKey in settings, vkAppId:${vkMiniAppId} userId: ${user}`,
        {
          vkApps,
        },
      );
      return null;
    }

    return {
      appId: vkMiniAppId,
      appSecret: secretKey,
      userId: user,
    };
  }
}
