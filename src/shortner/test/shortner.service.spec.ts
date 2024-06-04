import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
// import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ShortnerService } from '../shortner.service';
import { TimeAnalyticsProps, UrlHistoryProps } from '../shortner.model';
import { Model } from 'mongoose';

describe('ShortnerService', () => {
  let service: ShortnerService;
  let urlHistoryModelMock: Model<UrlHistoryProps>;
  let timeAnalyticsModelMock: Model<TimeAnalyticsProps>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShortnerService,
        {
          provide: getModelToken('UrlHistory'),
          useValue: {
            create: jest.fn(),
            findOne: jest.fn(),
            updateOne: jest.fn(),
          },
        },
        {
          provide: getModelToken('TimeAnalytics'),
          useValue: {
            create: jest.fn(),
          },
        },
        // {
        //   provide: CACHE_MANAGER,
        //   useValue: {
        //     get: jest.fn(),
        //     set: jest.fn(),
        //   },
        // },
      ],
    }).compile();

    service = module.get<ShortnerService>(ShortnerService);
    urlHistoryModelMock = module.get<Model<UrlHistoryProps>>(
      getModelToken('UrlHistory'),
    );
    timeAnalyticsModelMock = module.get<Model<TimeAnalyticsProps>>(
      getModelToken('TimeAnalytics'),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('recordAnalytics', () => {
    it('should record analytics', async () => {
      const now = new Date();
      const id = 'shortUrlId';
      const ref = 'reference';
      const shortUrl = 'http://localhost:3000/abc';
      const userAgent = 'User Agent String';
      const expectedDeviceInfo = {
        deviceType: 'Desktop',
        osType: 'Windows',
        browserType: 'Chrome',
      };

      // jest.spyOn(timeAnalyticsModelMock, 'create').mockResolvedValueOnce();
      jest
        .spyOn(service as any, 'mapUserAgentToDeviceInfo')
        .mockReturnValueOnce(expectedDeviceInfo);
      // jest.spyOn(urlHistoryModelMock, 'updateOne').mockResolvedValueOnce();

      await service.recordAnalytics(id, ref, shortUrl, userAgent);

      expect(timeAnalyticsModelMock.create).toHaveBeenCalledWith({
        shortUrlId: id,
        clickedAt: now,
      });
      expect(urlHistoryModelMock.updateOne).toHaveBeenCalledWith(
        { shortUrl },
        {
          $inc: {
            clicks: 1,
            [`osType.${expectedDeviceInfo.osType}`]: 1,
            [`deviceType.${expectedDeviceInfo.deviceType}`]: 1,
            [`browserType.${expectedDeviceInfo.browserType}`]: 1,
            [`refType.${ref}`]: 1,
          },
        },
      );
    });
  });
});
