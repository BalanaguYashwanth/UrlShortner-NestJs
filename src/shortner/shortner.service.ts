import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { TimeAnalyticsProps, UrlHistoryProps } from './shortner.model';
import { CreateShortUrlDto } from './shortner.dto';
import { checkUrlExpiration, mapUserAgentToDeviceInfo } from './helpers';
import { HandleUserClicksOps } from './common/handleUserClicksOps.helpers';

@Injectable()
export class ShortnerService {
  private readonly noPageFound = null;
  private readonly EXPIRED = `${process.env.BACKEND_URL}/404`;
  constructor(
    @InjectModel('Affiliate')
    private readonly affiliateModel: Model<any>,
    @InjectModel('UrlHistory')
    private readonly urlHistoryModel: Model<UrlHistoryProps>,
    @InjectModel('TimeAnalytics')
    private readonly timeAnalyticsModel: Model<TimeAnalyticsProps>,
    private readonly handleUserClicksOps: HandleUserClicksOps,
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

  getShortURL = async (shortAlias: string, ref: string, userAgent: string) => {
    try {
      const hasShortUrlDetails = await this.affiliateModel.findOne({
        urlAlias: shortAlias,
      });
      if (hasShortUrlDetails) {
        const {
          campaignInfoAddress,
          campaignProfileAddress,
          profileAddress,
          originalUrl,
          expirationTime = null,
        } = hasShortUrlDetails as any;

        if (originalUrl === this.EXPIRED) {
          return this.noPageFound;
        }

        if (checkUrlExpiration(expirationTime)) {
          await this.handleUserClicksOps.updateClickExpire(campaignInfoAddress);
          return this.noPageFound;
        }

        await this.handleUserClicksOps.updateClickCount({
          campaignInfoAddress,
          campaignProfileAddress,
          profileAddress,
        });

        return originalUrl;
      }
    } catch (err) {
      console.log('err-->', err);
    }
  };
}
