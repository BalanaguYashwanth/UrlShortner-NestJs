import { Model } from 'mongoose';
import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { TimeAnalyticsProps, UrlHistoryProps } from './shortner.model';
import { QueueService } from 'src/queue/queue.service';
import { CreateShortUrlDto } from './shortner.dto';
import { checkUrlExpiration, mapUserAgentToDeviceInfo } from './helpers';
import { HandleUserClicksOps } from './common/handleUserClicksOps.helpers';

@Injectable()
export class ShortnerService {
  constructor(
    @InjectModel('Affiliate')
    private readonly affiliateModel: Model<any>,
    @InjectModel('Campaign')
    private readonly campaignModel: Model<any>,
    @InjectModel('UrlHistory')
    private readonly urlHistoryModel: Model<UrlHistoryProps>,
    @InjectModel('TimeAnalytics')
    private readonly timeAnalyticsModel: Model<TimeAnalyticsProps>,
    private readonly handleUserClicksOps: HandleUserClicksOps,
    @Inject(forwardRef(() => QueueService))
    private readonly queueService: QueueService,
  ) {}

  recordAnalytics = async (
    id: string,
    ref: string,
    shortUrl: string,
    userAgent: string,
  ): Promise<void> => {
    const { deviceType, osType, browserType } =
      mapUserAgentToDeviceInfo(userAgent);
    const now = new Date();

    await this.timeAnalyticsModel.create({
      shortUrlId: id,
      clickedAt: now,
    });

    const query = {
      clicks: 1,
      [`osType.${osType}`]: 1,
      [`deviceType.${deviceType}`]: 1,
      [`browserType.${browserType}`]: 1,
      [`refType.${ref}`]: 1,
    };

    await this.urlHistoryModel.updateOne({ shortUrl }, { $inc: query });
  };

  createShortURL = async (
    id: string,
    createShortUrlDto: CreateShortUrlDto,
  ): Promise<string> => {
    const { expirationTime = null, url, shortUrl } = createShortUrlDto;
    const shortAlias = shortUrl.split('/')[3];
    const newShortUrl = new this.urlHistoryModel({
      expirationTime,
      shortUrl,
      shortAlias,
      url,
      userId: id,
    });

    await newShortUrl.save();
    return shortUrl;
  };

  recordAndUpdateShortURLMetrics = async ({ hasShortUrlDetails, ip }) => {
    const {
      totalIPAddress,
      urlAlias,
      campaignInfoAddress,
      campaignProfileAddress,
      profileAddress,
    } = hasShortUrlDetails;
    try {
      if (totalIPAddress.includes(ip)) {
        console.log('=====ip address already existed=====');
        await this.affiliateModel.updateOne(
          {
            urlAlias,
          },
          { $inc: { invalidClicks: 1 } },
          { new: true },
        );
        (await this.campaignModel.findOneAndUpdate(
          {
            campaignInfoAddress,
          },
          { $inc: { invalidClicks: 1 } },
          { new: true },
        )) as any;
        console.log('====invalid==response=====processed=====');
      } else {
        console.log('=====ip address not not existed=====');
        await this.handleUserClicksOps.updateClickCount({
          campaignInfoAddress,
          campaignProfileAddress,
          profileAddress,
        });

        (await this.affiliateModel.findOneAndUpdate(
          {
            urlAlias,
          },
          { $addToSet: { totalIPAddress: ip }, $inc: { validClicks: 1 } },
          { new: true },
        )) as any;

        (await this.campaignModel.findOneAndUpdate(
          {
            campaignInfoAddress,
          },
          { $inc: { validClicks: 1 } },
          { new: true },
        )) as any;
      }
      console.log('---recieved---');
    } catch (error) {
      console.log('----main------err--->', error);
      return error;
    }
  };

  getShortURL = async (urlAlias: string, ip: string, userAgent: string) => {
    try {
      //todo - implement the redis cache, so db calls will be reduce and price also reduce.
      const hasShortUrlDetails = await this.affiliateModel.findOne({
        urlAlias,
      });
      if (hasShortUrlDetails) {
        const url = this.processMetrics({ hasShortUrlDetails, ip });
        return url;
      }
    } catch (err) {
      console.log('err-->', err);
    }
  };

  processMetrics = async ({ hasShortUrlDetails, ip }: any) => {
    const {
      campaignInfoAddress,
      originalUrl,
      expirationTime = null,
      urlAlias,
    } = hasShortUrlDetails as any;

    const urlExpired = await this.checkIsUrlExpired({
      originalUrl,
      expirationTime,
      campaignInfoAddress,
      urlAlias,
    });

    if (urlExpired) {
      return originalUrl;
    }

    //pushing metrics to queue to record
    const params = {
      hasShortUrlDetails,
      ip,
    };
    // const paramsStringify = JSON.stringify(params);
    // console.log('pushing messages to queue======>', paramsStringify);
    // await this.queueService.pushMessageToQueue(paramsStringify);
    await this.recordAndUpdateShortURLMetrics(params);
    return originalUrl;
  };

  checkIsUrlExpired = async ({ expirationTime, campaignInfoAddress }: any) => {
    if (checkUrlExpiration(expirationTime)) {
      await this.handleUserClicksOps.updateClickExpire(campaignInfoAddress);
      return true;
    }
  };
}
