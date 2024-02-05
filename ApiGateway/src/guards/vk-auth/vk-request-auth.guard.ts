import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import * as crypto from 'crypto';
import { PinoLogger } from 'nestjs-pino';
import { VkAppSettingsService } from './vk-app-settings.service';

@Injectable()
export class VkRequestAuthGuard implements CanActivate {
  constructor(
    private readonly vkAppSettingsService: VkAppSettingsService,
    private readonly logger: PinoLogger,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      return await this.checkSign(context);
    } catch (error) {
      this.logger.error('VkRequestAuthGuard error', error);
      return false;
    }
  }

  private async checkSign(context: ExecutionContext): Promise<boolean> {
    const req: Request = context.switchToHttp().getRequest();
    const vkAppSettings = await this.vkAppSettingsService.getAppSettings(req);
    if (!vkAppSettings) {
      this.logger.error('VkRequestAuthGuard there is not vkAppSettings');
      return false;
    }

    const { ts, sign, ...signPayload } = req.body;
    if (!ts || !sign) {
      this.logger.warn('SIGN | there is not ts or sign', {
        body: req.body,
      });
      return false;
    }

    const formatedPayload = Object.entries(signPayload).reduce(
      (str, [key, value], index) => {
        const separator = index === 0 ? '' : '&';
        return `${str}${separator}${key}=${value}`;
      },
      '',
    );
    const hashParams = {
      app_id: vkAppSettings.appId,
      request_id: formatedPayload,
      ts,
      user_id: vkAppSettings.userId,
    };

    const hashParamsString = Object.entries(hashParams)
      .reduce((array, [key, value]) => {
        array.push({ key, value });
        return array;
      }, [])
      .sort((a, b) => a.key.localeCompare(b.key))
      .reduce<string>((acc, { key, value }, idx) => {
        return (
          acc + (idx === 0 ? '' : '&') + `${key}=${encodeURIComponent(value)}`
        );
      }, '');

    const paramsHash = crypto
      .createHmac('sha256', vkAppSettings.appSecret)
      .update(hashParamsString)
      .digest()
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=$/, '');

    const result = paramsHash == sign;

    if (!result) {
      this.logger.warn(
        `SIGN_INCORRECT [paramsHash:${paramsHash}] | [sign:${sign}] | hashParamsString: ${hashParamsString} | formatedPayload: ${formatedPayload} | ts:${ts} app_id: ${vkAppSettings.appId}`,
      );
    }

    return result;
  }
}
