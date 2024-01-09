import { FaceSwapperService } from '../src/face-swapper/face-swapper.service';
import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserSchema } from '../src/Schemas/User.schema';
import { UsersService } from '../src/face-swapper/users/users.service';
import { Config, ConfigSchema } from '../src/Schemas/Config.schema';
import { closeInMongodConnection, rootMongooseTestModule } from './MongooseTestModule';
import { ImageSchema, Image } from '../src/Schemas/Image.schema';
import { FaceSwapperController } from '../src/face-swapper/face-swapper.controller';
import { CanActivate, Injectable } from '@nestjs/common';
import { VkAuthGuard } from '../src/guards/vk-auth/vk-auth.guard';
import { MinioService } from '../src/face-swapper/minio/minio.service';
import { HttpModule, HttpService } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { Directory, DirectorySchema } from '../src/Schemas/Directory.schema';
import { Readable } from 'stream';
import { JobResult } from 'src/face-swapper/face-swapper.models';
import { from} from 'rxjs';

@Injectable()
export class MockGuard implements CanActivate {
  constructor() {}
  canActivate() {
    return true
  }
}

@Injectable()
export class MockMinio{
}

describe('FaceSwapperController (e2e)', () => {
  const id = '1';
  const taskId: string = '123'
  let usersService: UsersService;
  let faceSwapperController: FaceSwapperController
  let httpService: HttpService
  let minioService: MinioService
  let configModel: Model<Config>

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        rootMongooseTestModule(),
        MongooseModule.forFeature([
          { name: User.name, schema: UserSchema },
          { name: Image.name, schema: ImageSchema },
          { name: Config.name, schema: ConfigSchema },
          { name: Directory.name, schema: DirectorySchema },
        ]),
        ConfigModule.forRoot(),
        HttpModule,
      ],
      controllers: [FaceSwapperController],
      providers: [UsersService, FaceSwapperService, MinioService, VkAuthGuard],
    })
    .overrideGuard(VkAuthGuard).useValue(MockGuard)
    .overrideProvider(MinioService).useValue(MockMinio)
    .compile();
    
    configModel = module.get<Model<Config>>(getModelToken(Config.name))
    httpService = module.get<HttpService>(HttpService)
    usersService = module.get<UsersService>(UsersService);
    minioService = module.get<MinioService>(MinioService)
    faceSwapperController = module.get<FaceSwapperController>(FaceSwapperController);

    await configModel.create({
      groupids: [1, 2],
      textcaption: 'mockcaption',
      textphoto: 'mocktext',
    });

  });

  afterAll(async () => {
    await closeInMongodConnection()
  })

  describe('Users', () => {

    it("(GET) should return user's limit", async () => {
      const result = await faceSwapperController.getLimit(id);

      expect(result).toEqual({
        limit: 1,
        extraGenerationAvailable: true,
      });
    });

    it('(PUT) should give user one more generation', async () => {

      await faceSwapperController.setUser(id)
      const result = await faceSwapperController.getLimit(id);

      expect(result).toEqual({
        limit: 2,
        extraGenerationAvailable: false,
      });
    });

    it('(PUT) should not give user generation twice', async () => {

      await faceSwapperController.setUser(id)
      const result = await faceSwapperController.getLimit(id);

      expect(result).toEqual({
        limit: 2,
        extraGenerationAvailable: false,
      });
    });
  })
  
  describe('FaceSwap', () => {

    it('(POST) should return task id', async () => {
      const file: Express.Multer.File = {
        originalname: 'file.png',
        mimetype: 'image/png',
        path: 'asdasd',
        buffer: Buffer.from([]),
        size: 0,
        fieldname: 'photo',
        encoding: 'utf-8',
        stream: new Readable(),
        destination: 'path',
        filename: 'file.png'
      };        

      const data = {
        id: taskId
      }

      jest
        .spyOn(httpService, 'post')
        .mockImplementationOnce(() => from([{data}]) as any);

      const result = await faceSwapperController.swapFace(file, id, 'man1.jpeg')
      
      expect(result).toEqual(data)
    })

    it('(GET) should return pending task result', async () => {

      const data: JobResult = {
        id: taskId,
        status: 'PENDING',
      }

      jest
        .spyOn(httpService, 'get')
        .mockImplementationOnce(() => from([{data}]) as any);

      const result = await faceSwapperController.getGeneratedImage(taskId)
      
      expect(result).toBe(data.status)
    })

    it('(GET) should return success task result', async () => {

      const data: JobResult = {
        id: taskId,
        status: 'SUCCESS',
        image: 'mock.png'
      }

      jest
        .spyOn(httpService, 'get')
        .mockImplementationOnce(() => from([{data}]) as any);

      const result = await faceSwapperController.getGeneratedImage(taskId)

      expect(result).toStrictEqual({
        groupids: [1,2],
        gr: `https://vk.com/app/${process.env.MINI_APP_ID}`,
        result: 'mock.png',
        textphoto: 'mocktext',
        textcaption: 'mockcaption',
      })
    })

    it('(GET) should decrease user limit', async () => {
      const result = await faceSwapperController.getLimit(id);

      expect(result).toEqual({
        limit: 1,
        extraGenerationAvailable: false,
      });
    })
  })
});
