import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { VkService } from './vk.service';
import { VkAuthGuard } from '../guards/vk-auth/vk-auth.guard';
import UploadDto from './dtos/Upload.dto';

@Controller('api/vk')
export class VkController {
  constructor(private readonly vkService: VkService) {}

  @UseGuards(VkAuthGuard)
  @Post('upload')
  async upload(@Body() uploadData: UploadDto) {
    return this.vkService.uploadFile(uploadData);
  }
}
