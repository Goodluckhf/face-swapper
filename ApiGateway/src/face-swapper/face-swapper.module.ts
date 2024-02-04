import { Module } from '@nestjs/common';
import { FaceSwapperController } from './face-swapper.controller';
import { FaceSwapperService } from './face-swapper.service';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../Schemas/User.schema';
import { Image, ImageSchema } from '../Schemas/Image.schema';
import { Config, ConfigSchema } from '../Schemas/Config.schema';
import { Directory, DirectorySchema } from '../Schemas/Directory.schema';
import { MinioService } from './minio/minio.service';
import { UsersService } from './users/users.service';
import { VkAuthGuard } from '../guards/vk-auth/vk-auth.guard';
import { VkRequestAuthGuard } from '../guards/vk-auth/vk-request-auth.guard';

@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Image.name, schema: ImageSchema },
      { name: Config.name, schema: ConfigSchema },
      { name: Directory.name, schema: DirectorySchema },
    ]),
  ],
  controllers: [FaceSwapperController],
  providers: [
    FaceSwapperService,
    UsersService,
    MinioService,
    VkAuthGuard,
    VkRequestAuthGuard,
  ],
  exports: [MinioService],
})
export class FaceSwapperModule {}
