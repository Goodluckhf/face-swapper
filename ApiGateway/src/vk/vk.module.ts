import { Module } from '@nestjs/common';
import { VkService } from './vk.service';
import { VkController } from './vk.controller';
import { HttpModule } from '@nestjs/axios';
import { MinioService } from 'src/face-swapper/minio/minio.service';
import { Directory, DirectorySchema } from 'src/Schemas/Directory.schema';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [ 
    HttpModule,
    MongooseModule.forFeature([
      { name: Directory.name, schema: DirectorySchema },
    ])
  ],
  providers: [VkService, MinioService],
  controllers: [VkController],
})
export class VkModule {}
