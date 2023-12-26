import { Module } from '@nestjs/common';
import { FaceSwapperController } from './face-swapper.controller';
import { FaceSwapperService } from './face-swapper.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [FaceSwapperController],
  providers: [FaceSwapperService],
})
export class FaceSwapperModule {}
