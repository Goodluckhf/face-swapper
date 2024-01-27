import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FaceSwapperService } from './face-swapper.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { MinioService } from './minio/minio.service';
import { UsersService } from './users/users.service';
import { VkAuthGuard } from '../guards/vk-auth/vk-auth.guard';
import { Response } from 'express';
import { User } from '../decorators/User.decorator';

@Controller('api/face-swapper')
export class FaceSwapperController {
  constructor(
    private readonly minioService: MinioService,
    private readonly faceSwapperService: FaceSwapperService,
    private readonly usersService: UsersService,
  ) {}

  @Get('image')
  async getImage(@Res() res: Response, @Query('path') path: string) {
    const stream = (await this.minioService.getFile(path)) as any;
    res.setHeader('Content-Type', stream.headers['content-type']);
    stream.pipe(res);
  }

  @UseGuards(VkAuthGuard)
  @UsePipes(ValidationPipe)
  @UseInterceptors(FileInterceptor('source'))
  @Post()
  async swapFace(
    @User() user: string,
    @UploadedFile() source: Express.Multer.File,
    @Body('target') target: string,
  ) {
    return await this.faceSwapperService.swapFace(user, source, target);
  }

  @UseGuards(VkAuthGuard)
  @Get('result/:id')
  async getGeneratedImage(@Param('id') id: string) {
    return await this.faceSwapperService.getResult(id);
  }

  @UseGuards(VkAuthGuard)
  @Get('base-images')
  async getImages(@Query('sex') sex: string = 'male') {
    return await this.minioService.getCategories(sex);
  }

  @UseGuards(VkAuthGuard)
  @Get('limits')
  async getLimit(@User() user: string) {
    return this.usersService.getLimit(user);
  }

  @UseGuards(VkAuthGuard)
  @Put('limits')
  async setUser(@User() user: string, @Body('groupIds') groupIds?: number[]) {
    return await this.usersService.setSubscription(user, groupIds);
  }
}
