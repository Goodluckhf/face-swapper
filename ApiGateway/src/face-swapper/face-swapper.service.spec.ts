import { Test, TestingModule } from '@nestjs/testing';
import { FaceSwapperService } from './face-swapper.service';

describe('FaceSwapperService', () => {
  let service: FaceSwapperService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FaceSwapperService],
    }).compile();

    service = module.get<FaceSwapperService>(FaceSwapperService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
