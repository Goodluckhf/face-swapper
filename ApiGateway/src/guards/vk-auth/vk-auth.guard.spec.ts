import { Test, TestingModule } from '@nestjs/testing';
import { VkAuthGuard } from './vk-auth.guard';
import { ConfigService } from '@nestjs/config';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { createMock } from '@golevelup/ts-jest';

describe('AuthGuard', () => {
  let app: INestApplication;
  let service: ConfigService;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'VK_SECRET_KEY') {
                return 'wvl68m4dR1UpLrVRli';
              }
              return null;
          })
          },
        },
      ],
    }).compile()

    app = moduleRef.createNestApplication();
    await app.init();

    service = moduleRef.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(new VkAuthGuard(service)).toBeDefined();
  });

  it('emtpty authorization', async () => {
    const mockExecutionContext = createMock<ExecutionContext>({});
    expect(new VkAuthGuard(service).canActivate(mockExecutionContext)).toBe(false)
  })

  it('should be passed', async () => {
    const mockExecutionContext = createMock<ExecutionContext>({
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {
            authorization: 'vk_user_id=494075&vk_app_id=6736218&vk_is_app_user=1&vk_are_notifications_enabled=1&vk_language=ru&vk_access_token_settings=&vk_platform=android&sign=htQFduJpLxz7ribXRZpDFUH-XEUhC9rBPTJkjUFEkRA',
          },
        }),
      }),
    });

    expect(new VkAuthGuard(service).canActivate(mockExecutionContext)).toBe(true)
  })


  it('should be failed', async () => {
    const mockExecutionContext = createMock<ExecutionContext>({
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {
            authorization: 'vk_user_id=494&vk_app_id=6736218&vk_is_app_user=1&vk_are_notifications_enabled=1&vk_language=ru&vk_access_token_settings=&vk_platform=android&sign=htQFduJpLxz7ribXRZpDFUHJkjUFEkRA',
          },
        }),
      }),
    });

    expect(new VkAuthGuard(service).canActivate(mockExecutionContext)).toBe(false)
  })

});
