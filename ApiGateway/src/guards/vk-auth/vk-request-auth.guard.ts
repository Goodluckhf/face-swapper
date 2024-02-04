import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import * as crypto from 'crypto';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class VkRequestAuthGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: PinoLogger,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    try {
      return this.checkSign(context);
    } catch (error) {
      this.logger.error('VkRequestAuthGuard error', error);
    }
  }

  private checkSign(context: ExecutionContext): boolean {
    const secretKey = this.configService.get('VK_SECRET_KEY');
    const adminUserId = this.configService.get('VK_ADMIN_USER_ID');
    const vkMiniAppId = this.configService.get('VK_MINI_APP_ID');
    const req: Request = context.switchToHttp().getRequest();
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
      app_id: vkMiniAppId,
      request_id: formatedPayload,
      ts,
      user_id: adminUserId,
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
      .createHmac('sha256', secretKey)
      .update(hashParamsString)
      .digest()
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=$/, '');

    return paramsHash == sign;
  }
}
