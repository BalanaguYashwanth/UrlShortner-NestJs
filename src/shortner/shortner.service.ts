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
      walletAddress,
    } = hasShortUrlDetails;
    try {
      if (
        totalIPAddress.includes(ip) ||
        walletAddress ===
          '0xc9b43975021bdda84230882545e5ec274eb55227ee3c400e50ffcf06f50df400' ||
        walletAddress ===
          '0x4aea4b6e254b03ea9e44761de6c8a33e75b201d4d652dfe442df1e5b97150bbb' ||
        walletAddress ===
          '0x7c2ddd61ff8efcd730886cdc7b5db795b9584f69e4ada18c16ad1937ee2e928d' ||
        walletAddress ===
          ' 0xe8fa5a8b5ae4f050fa4307c2ce703635558c9faedab016718161b90440c76180' ||
        walletAddress ===
          '0xbd0c9fa2110283c1c812c423567e24b56ffe79efd7c572ca4096ea7f63f6e9d0' ||
        walletAddress ===
          '0x8f3985bd18d48ae77ee3de1448bea907e59cf80ef670f73a30df35202087e121' ||
        walletAddress ===
          '0x9c227d598d9f5f5420e6719dccd32e4106beff6e8df3479b9f13572cdbffac32' ||
        walletAddress ===
          '0x96c51e667d2bc79342e3c7fc659639e0fbd4fa549b395ee98e91588a659bc7e0'
      ) {
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
        const url = await this.processMetrics({ hasShortUrlDetails, ip });
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

    const params = {
      hasShortUrlDetails,
      ip,
    };
    await new Promise((resolve) => setTimeout(resolve, 1000));
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
