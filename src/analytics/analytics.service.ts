import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { Model } from 'mongoose';
import {
  TimeAnalyticsProps,
  UrlHistoryProps,
} from 'src/shortner/shortner.model';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel('UrlHistory')
    private readonly urlHistoryModel: Model<UrlHistoryProps>,
    @InjectModel('TimeAnalytics')
    private readonly timeAnalyticsModel: Model<TimeAnalyticsProps>,
  ) {}

  urlAnalytics = async (id: string) => {
    let analyticsDetails = await this.urlHistoryModel.find({ userId: id });
    analyticsDetails = JSON.parse(JSON.stringify(analyticsDetails));
    for (const analyticItem of analyticsDetails) {
      const { _id } = analyticItem;
      const mostActiveHours = await this.timeAnalyticsModel.aggregate([
        {
          $match: {
            shortUrlId: new ObjectId(_id),
          },
        },
        {
          $unwind: '$clickedAt',
        },
        {
          $group: {
            _id: { $hour: '$clickedAt' },
            count: { $sum: 1 },
          },
        },
        {
          $sort: { count: -1 },
        },
        {
          $project: {
            _id: 0,
            hour: { $concat: [{ $toString: '$_id' }, ':00:00 GMT'] },
            clicks: '$count',
          },
        },
        {
          $limit: 5,
        },
      ]);
      analyticItem['activeHours'] = mostActiveHours;
    }
    return analyticsDetails;
  };
}
