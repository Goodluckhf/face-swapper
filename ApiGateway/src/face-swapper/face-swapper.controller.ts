import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FaceSwapperService } from './face-swapper.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('face-swapper')
export class FaceSwapperController {
  constructor(private readonly faceSwapperService: FaceSwapperService) {}

  @UsePipes(ValidationPipe)
  @UseInterceptors(FileInterceptor('source'))
  @Post()
  async swapFace(
    @UploadedFile() source: Express.Multer.File,
    @Body('target') target: string,
  ) {
    return await this.faceSwapperService.swapFace(source, target);
  }

  @Get('/:id')
  async getImage(@Param('id') id: string) {
    return await this.faceSwapperService.getResult(id);
  }
}
