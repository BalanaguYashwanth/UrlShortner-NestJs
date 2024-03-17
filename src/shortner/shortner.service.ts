import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as moment from 'moment';
import { Model } from 'mongoose';
import { CreateShortUrlDto } from './shortner.dto';
import { AnalyticsProps, ShortUrlProps } from './shortner.model';

@Injectable()
export class ShortnerService {
  private readonly DOMAIN = 'http://localhost:3000';
  constructor(
    @InjectModel('ShortUrlModel')
    private readonly shortUrlModel: Model<ShortUrlProps>,
    @InjectModel('Analytics')
    private readonly analyticsModel: Model<AnalyticsProps>,
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

  recordAnalytics = async (shortUrl: string, userAgent: string) => {
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
      osType = 'MacOS';
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

    await this.analyticsModel.updateOne(
      {
        shortUrl,
      },
      {
        $inc: {
          count: 1,
          [`osType.${osType}`]: 1,
          [`deviceType.${deviceType}`]: 1,
          [`browserType.${browserType}`]: 1,
        },
      },
      {
        upsert: true,
      },
    );
  };

  createShortURL = async (
    createShortUrlDto: CreateShortUrlDto,
  ): Promise<string> => {
    const { expirationTime = null, url } = createShortUrlDto;
    const shortAlias = this.generateRandomAlphaNumeric();
    //Todo - Move to .env
    const shortUrl = `${this.DOMAIN}/${shortAlias}`;
    const newShortUrl = new this.shortUrlModel({
      expirationTime,
      shortAlias,
      shortUrl,
      url,
      visitHistory: [],
    });
    await newShortUrl.save();
    return shortUrl;
  };

  getShortURL = async (id: string, userAgent: string): Promise<string> => {
    const response = await this.shortUrlModel.findOne({ shortAlias: id });
    if (response) {
      const { expirationTime, shortUrl, url } = response as any;
      await this.recordAnalytics(shortUrl, userAgent);
      if (this.checkUrlExpiration(expirationTime)) {
        return this.noPageFound();
      }
      return url;
    } else {
      return this.noPageFound();
    }
  };
}
