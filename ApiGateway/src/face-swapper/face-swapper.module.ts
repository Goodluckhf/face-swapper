import { Module } from '@nestjs/common';
import { FaceSwapperController } from './face-swapper.controller';
import { FaceSwapperService } from './face-swapper.service';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/Schemas/User.schema';
import { Image, ImageSchema } from 'src/Schemas/Image.schema';
import { Config, ConfigSchema } from 'src/Schemas/Config.schema';
import { Directory, DirectorySchema } from 'src/Schemas/Directory.schema';
import { MinioService } from './minio/minio.service';
import { UsersService } from './users/users.service';
import { VkAuthGuard } from 'src/guards/vk-auth/vk-auth.guard';

@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([
      {name: User.name, schema: UserSchema},
      {name: Image.name, schema: ImageSchema},
      {name: Config.name, schema: ConfigSchema},
      {name: Directory.name, schema: DirectorySchema}
    ])
  ],
  controllers: [FaceSwapperController],
  providers: [FaceSwapperService, UsersService, MinioService, VkAuthGuard],
})
export class FaceSwapperModule {}