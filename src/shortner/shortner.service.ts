import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Model } from 'mongoose';
import { CreateShortUrlDto } from './shortner.dto';
import { TimeAnalyticsProps, UrlHistoryProps } from './shortner.model';
import {
  checkUrlExpiration,
  generateRandomAlphaNumeric,
  mapUserAgentToDeviceInfo,
} from './helpers';

@Injectable()
export class ShortnerService {
  private readonly DOMAIN = process.env.DOMAIN || 'http://localhost:3000';
  private readonly noPageFound = null;

  constructor(
    @InjectModel('UrlHistory')
    private readonly urlHistoryModel: Model<UrlHistoryProps>,
    @InjectModel('TimeAnalytics')
    private readonly timeAnalyticsModel: Model<TimeAnalyticsProps>,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
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
    const { expirationTime = null, url } = createShortUrlDto;
    const shortAlias = generateRandomAlphaNumeric();
    const shortUrl = `${this.DOMAIN}/${shortAlias}`;

    const newShortUrl = new this.urlHistoryModel({
      expirationTime,
      shortAlias,
      shortUrl,
      url,
      userId: id,
    });

    await newShortUrl.save();
    return shortUrl;
  };

  private createRedisCache = async (key: string, value: any): Promise<void> => {
    await this.cacheManager.set(key, value, 300000);
  };

  getShortURL = async (shortAlias: string, ref: string, userAgent: string) => {
    let hasShortUrlDetails = await this.cacheManager.get(shortAlias);

    if (!hasShortUrlDetails) {
      hasShortUrlDetails = await this.urlHistoryModel.findOne({ shortAlias });
    }

    if (!hasShortUrlDetails || hasShortUrlDetails === 404) {
      await this.createRedisCache(shortAlias, 404);
      return this.noPageFound;
    }

    await this.createRedisCache(shortAlias, hasShortUrlDetails);
    const { _id, expirationTime, shortUrl, url } = hasShortUrlDetails as any;
    this.recordAnalytics(_id, ref, shortUrl, userAgent);

    if (checkUrlExpiration(expirationTime)) {
      return this.noPageFound;
    }

    return url;
  };
}
