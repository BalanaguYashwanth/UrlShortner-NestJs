import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import * as moment from 'moment';
import { Model } from 'mongoose';
import { CreateShortUrlDto } from './shortner.dto';
import { TimeAnalyticsProps, UrlHistoryProps } from './shortner.model';

@Injectable()
export class ShortnerService {
  private readonly DOMAIN = 'http://localhost:3000';
  constructor(
    @InjectModel('UrlHistory')
    private readonly urlHistoryModel: Model<UrlHistoryProps>,
    @InjectModel('TimeAnalytics')
    private readonly timeAnalyticsModel: Model<TimeAnalyticsProps>,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  generateRandomAlphaNumeric = () => {
    const characters = 'abcdefghijklmnopqrstuvwxyz';
    const charactersLimit = 4;
    let randomFourCharacters = '';

    for (let i = 0; i < charactersLimit; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      randomFourCharacters += characters.charAt(randomIndex);
    }

    return randomFourCharacters;
  };

  checkUrlExpiration = (expirationTime) => {
    const currentTime = moment().unix();
    if (expirationTime && expirationTime < currentTime) {
      return true;
    }
  };

  noPageFound = () => {
    return `${this.DOMAIN}/404`;
  };

  recordAnalytics = async (
    id: string,
    ref: string,
    shortUrl: string,
    userAgent: string,
  ) => {
    let deviceType: string;
    let osType: string;
    let browserType: string;

    if (/iPad/i.test(userAgent)) {
      deviceType = 'iPad';
    } else if (/Mobile/i.test(userAgent)) {
      deviceType = 'Mobile';
    } else {
      deviceType = 'Desktop';
    }

    if (/Android/i.test(userAgent)) {
      osType = 'Android';
    } else if (/iPhone/i.test(userAgent)) {
      osType = 'iPhone';
    } else if (/Mac OS/i.test(userAgent)) {
      osType = 'Mac';
    } else if (/Windows/i.test(userAgent)) {
      osType = 'Windows';
    } else {
      osType = 'Unknown';
    }

    if (userAgent.includes('MSIE')) {
      browserType = 'Internet Explorer';
    } else if (userAgent.includes('Firefox')) {
      browserType = 'Firefox';
    } else if (userAgent.includes('Edg')) {
      browserType = 'Edge';
    } else if (userAgent.includes('Chrome')) {
      browserType = 'Chrome';
    } else if (userAgent.includes('Safari')) {
      browserType = 'Safari';
    } else {
      browserType = 'Unknown';
    }
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

    await this.urlHistoryModel.updateOne(
      {
        shortUrl,
      },
      {
        $inc: query,
      },
    );
  };

  createShortURL = async (
    id: string,
    createShortUrlDto: CreateShortUrlDto,
  ): Promise<string> => {
    const { expirationTime = null, url } = createShortUrlDto;
    const shortAlias = this.generateRandomAlphaNumeric();
    //Todo - Move to .env
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

  getShortURL = async (
    shortAlias: string,
    ref: string,
    userAgent: string,
  ): Promise<string> => {
    let hasShortUrlDetails;
    hasShortUrlDetails = await this.cacheManager.get(shortAlias);
    if (!hasShortUrlDetails) {
      hasShortUrlDetails = await this.urlHistoryModel.findOne({ shortAlias });
    }

    if (hasShortUrlDetails) {
      // If it exists in cache override updated data with ttl or else add cache with ttl
      await this.cacheManager.set(shortAlias, hasShortUrlDetails, 300000);
      const { _id, expirationTime, shortUrl, url } = hasShortUrlDetails as any;
      this.recordAnalytics(_id, ref, shortUrl, userAgent);
      if (this.checkUrlExpiration(expirationTime)) {
        return this.noPageFound();
      }
      return url;
    } else {
      return this.noPageFound();
    }
  };
}
