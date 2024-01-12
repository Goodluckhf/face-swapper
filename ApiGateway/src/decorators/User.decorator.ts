import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request: Request = ctx.switchToHttp().getRequest();
    const authorization = request.headers['authorization']
    if(!authorization) return null

    const token = authorization.split('&').find(item => /vk_user_id/.test(item))
    if(token){
      return token.split('=')[1]
    }

    return null
  },
);
