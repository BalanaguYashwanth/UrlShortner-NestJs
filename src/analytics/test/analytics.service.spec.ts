import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import {
  TimeAnalyticsProps,
  UrlHistoryProps,
} from 'src/shortner/shortner.model';
import { AnalyticsService } from '../analytics.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let urlHistoryModelMock: Model<UrlHistoryProps>;
  let timeAnalyticsModelMock: Model<TimeAnalyticsProps>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: getModelToken('UrlHistory'),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: getModelToken('TimeAnalytics'),
          useValue: {
            aggregate: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
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

  describe('urlAnalytics', () => {
    it('should return analytics details for a given user id', async () => {
      const userId = 'someUserId';
      const urlHistoryMockData = [{ _id: 'someId1' }, { _id: 'someId2' }];
      const timeAnalyticsMockData = [
        { hour: '00:00:00 GMT', clicks: 10 },
        { hour: '01:00:00 GMT', clicks: 5 },
      ];

      jest
        .spyOn(urlHistoryModelMock, 'find')
        .mockResolvedValueOnce(urlHistoryMockData);
      jest
        .spyOn(timeAnalyticsModelMock, 'aggregate')
        .mockResolvedValueOnce(timeAnalyticsMockData);

      const result = await service.urlAnalytics(userId);

      expect(result).toEqual([
        {
          _id: 'someId1',
          activeHours: [
            { hour: '00:00:00 GMT', clicks: 10 },
            { hour: '01:00:00 GMT', clicks: 5 },
          ],
        },
        {
          _id: 'someId2',
          activeHours: [
            { hour: '00:00:00 GMT', clicks: 10 },
            { hour: '01:00:00 GMT', clicks: 5 },
          ],
        },
      ]);
    });
  });
});
