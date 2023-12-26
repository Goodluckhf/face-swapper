import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { FaceSwapperModule } from './face-swapper/face-swapper.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), FaceSwapperModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
