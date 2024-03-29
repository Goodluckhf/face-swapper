import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { FaceSwapperModule } from './face-swapper/face-swapper.module';
import { MongooseModule } from '@nestjs/mongoose';
import { NestMinioModule } from 'nestjs-minio';
import { VkModule } from './vk/vk.module';
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    LoggerModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        uri: configService.get('MONGO'),
      }),
      inject: [ConfigService],
    }),
    NestMinioModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        isGlobal: true,
        useSSL: false,
        endPoint: configService.get('ENDPOINT'),
        port: parseInt(configService.get('PORT'), 10),
        accessKey: configService.get('ACCESS_KEY'),
        secretKey: configService.get('SECRET_KEY'),
      }),
      inject: [ConfigService],
    }),
    FaceSwapperModule,
    VkModule,
  ],
})
export class AppModule {}
