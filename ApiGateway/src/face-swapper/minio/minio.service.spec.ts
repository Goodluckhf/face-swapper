import { closeInMongodConnection, rootMongooseTestModule } from './../../../test/MongooseTestModule';
import { MinioService } from './minio.service';
import { Test } from '@nestjs/testing';
import { MINIO_CONNECTION, NestMinioModule } from 'nestjs-minio';
import { Config, ConfigSchema } from '../../Schemas/Config.schema';
import { Directory, DirectorySchema } from '../../Schemas/Directory.schema';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { File } from './minio.models';
import { Model } from 'mongoose';

describe('MinioService', () => {
  let minioService: MinioService;
  let directoryModel: Model<Directory>

  beforeAll(async () => {

    const moduleRef = await Test.createTestingModule({
      imports: [
        rootMongooseTestModule(),
        MongooseModule.forFeature([
          { name: Config.name, schema: ConfigSchema },
          { name: Directory.name, schema: DirectorySchema },
        ]),
        NestMinioModule.register({
          isGlobal: true,
          useSSL: false,
          endPoint: 'localhost',
          port: 9000,
          accessKey: 'minioadmin',
          secretKey: 'minioadmin',
        }),
        ConfigModule.forRoot()
      ],
      providers: [MinioService]
    })
    .useMocker((token) => {
      if (token === MINIO_CONNECTION) {
        return null;
      }
    })
    .compile();

    minioService = moduleRef.get(MinioService);
    directoryModel = moduleRef.get<Model<Directory>>(getModelToken(Directory.name))

    await directoryModel.create({
      sex: 'male',
      path: 'data',
      name: 'Новогоднее',
    });
  });

  afterAll(async () => {
    await closeInMongodConnection()
  })

  it('should return folders', async () => {
      const mockFiles: File[] = [
        {
          path: 'data/0075ae5a-0607-473a-bcb3-988f582f4f6f-Screenshot from 2023-11-29 00-50-00.png',
          root: '',
          dir: 'data',
          base: '0075ae5a-0607-473a-bcb3-988f582f4f6f-Screenshot from 2023-11-29 00-50-00.png',
          ext: '.png',
          name: '0075ae5a-0607-473a-bcb3-988f582f4f6f-Screenshot from 2023-11-29 00-50-00'
        },
        {
          path: 'data/05fe6c4f-8cd9-45ad-ad28-e36b6a05b93e-Screenshot from 2023-11-29 00-50-00.png',
          root: '',
          dir: 'data',
          base: '05fe6c4f-8cd9-45ad-ad28-e36b6a05b93e-Screenshot from 2023-11-29 00-50-00.png',
          ext: '.png',
          name: '05fe6c4f-8cd9-45ad-ad28-e36b6a05b93e-Screenshot from 2023-11-29 00-50-00'
        }
      ]

      jest
        .spyOn(minioService, 'getFiles')
        .mockImplementationOnce(() => Promise.resolve(mockFiles));

      const result = await minioService.getCategories('male');
      
      expect(result).toEqual([
        {
          "name": "Новогоднее",
          "path": "data",
          "photos": [
              {
                  "name": "data/0075ae5a-0607-473a-bcb3-988f582f4f6f-Screenshot from 2023-11-29 00-50-00.png"
              },
              {
                  "name": "data/05fe6c4f-8cd9-45ad-ad28-e36b6a05b93e-Screenshot from 2023-11-29 00-50-00.png"
              }
          ]
        }
      ]);
  })
});
