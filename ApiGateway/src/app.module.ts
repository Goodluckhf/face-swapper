import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FaceSwapperModule } from './face-swapper/face-swapper.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), FaceSwapperModule],
})
export class AppModule {}
