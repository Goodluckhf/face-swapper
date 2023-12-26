import { Test, TestingModule } from '@nestjs/testing';
import { FaceSwapperController } from './face-swapper.controller';

describe('FaceSwapperController', () => {
  let controller: FaceSwapperController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FaceSwapperController],
    }).compile();

    controller = module.get<FaceSwapperController>(FaceSwapperController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
