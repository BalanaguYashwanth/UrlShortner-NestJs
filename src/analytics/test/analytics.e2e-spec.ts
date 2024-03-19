import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AuthModule } from 'src/auth/auth.module';
import { AnalyticsController } from '../analytics.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  TimeAnalyticsSchema,
  UrlHistorySchema,
} from 'src/shortner/shortner.model';
import { AnalyticsService } from '../analytics.service';

describe('AnalyticsController (e2e)', () => {
  let app: INestApplication;
  let analyticsService: AnalyticsService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AuthModule,
        MongooseModule.forFeature([
          {
            name: 'UrlHistory',
            schema: UrlHistorySchema,
            collection: 'urlhistory',
          },
          { name: 'TimeAnalytics', schema: TimeAnalyticsSchema },
        ]),
      ],
      controllers: [AnalyticsController],
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

    app = moduleFixture.createNestApplication();
    await app.init();

    analyticsService = moduleFixture.get<AnalyticsService>(AnalyticsService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return analytics details for a given user id', async () => {
    const userId = 'someUserId';
    // Sample Mock data urlHistoryMockData & timeAnalyticsMockData
    const urlHistoryMockData = [
      { _id: 'someId1' },
      { _id: 'someId2' },
    ];
    const timeAnalyticsMockData = [
      { hour: '00:00:00 GMT', clicks: 10 },
      { hour: '01:00:00 GMT', clicks: 5 },
    ];

    jest.spyOn(analyticsService, 'urlAnalytics').mockResolvedValueOnce([
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

    const response = await request(app.getHttpServer())
      .get(`/analytics/${userId}`)
      .expect(200);

    expect(response.body).toEqual([
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
