import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import * as crypto from 'crypto'

interface IQueryParam {
  key: string;
  value: string;
}

@Injectable()
export class VkAuthGuard implements CanActivate {

  constructor(
    private readonly configService: ConfigService
  ){}

  canActivate(
    context: ExecutionContext,
  ): boolean {

    const secretKey = this.configService.get('VK_SECRET_KEY')
    const req: Request = context.switchToHttp().getRequest()
    const searchOrParsedUrlQuery = req.headers.authorization
    if(!searchOrParsedUrlQuery){
      return false
    }
    
    let sign: string | undefined;
    const queryParams: IQueryParam[] = [];
    const processQueryParam = (key: string, value: any) => {
      if (typeof value === 'string') {
        if (key === 'sign') {
            sign = value;
        } 
        else if (key.startsWith('vk_')) {
            queryParams.push({key, value});
        }
    }}

    if (typeof searchOrParsedUrlQuery === 'string') {
        const formattedSearch = searchOrParsedUrlQuery.startsWith('?')
            ? searchOrParsedUrlQuery.slice(1)
            : searchOrParsedUrlQuery;

        for (const param of formattedSearch.split('&')) {
            const [key, value] = param.split('=');
            processQueryParam(key, value);
        }
    } else {
        for (const key of Object.keys(searchOrParsedUrlQuery)) {
            const value = searchOrParsedUrlQuery[key];
            processQueryParam(key, value);
        }
    }

    if (!sign || queryParams.length === 0) {
        return false;
    }

    const queryString = queryParams
        .sort((a, b) => a.key.localeCompare(b.key))
        .reduce<string>((acc, {key, value}, idx) => {
            return acc + (idx === 0 ? '' : '&') + `${key}=${encodeURIComponent(value)}`;
        }, '');
        
    const paramsHash = crypto
        .createHmac('sha256', secretKey)
        .update(queryString)
        .digest()
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=$/, '');
    
    return paramsHash == sign
  }
}