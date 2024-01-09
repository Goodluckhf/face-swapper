import { Module } from '@nestjs/common';
import { VkService } from './vk.service';
import { VkController } from './vk.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  providers: [VkService],
  controllers: [VkController],
})
export class VkModule {}
