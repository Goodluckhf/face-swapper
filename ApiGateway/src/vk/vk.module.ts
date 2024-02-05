import { Module } from '@nestjs/common';
import { VkService } from './vk.service';
import { VkController } from './vk.controller';
import { HttpModule } from '@nestjs/axios';
import { MinioService } from 'src/face-swapper/minio/minio.service';
import { Directory, DirectorySchema } from 'src/Schemas/Directory.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { VkAppSettingsService } from '../guards/vk-auth/vk-app-settings.service';
import { Config, ConfigSchema } from '../Schemas/Config.schema';

@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([
      { name: Directory.name, schema: DirectorySchema },
      { name: Config.name, schema: ConfigSchema },
    ]),
  ],
  providers: [VkService, MinioService, VkAppSettingsService],
  controllers: [VkController],
})
export class VkModule {}
