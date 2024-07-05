import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import ProxyCheck from 'proxycheck-ts';
import { TimeAnalyticsProps, UrlHistoryProps } from './shortner.model';
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
  ) {}

  //todo - As of now, not using deeperAnalytics if needed then url this fn
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

  insertOrUpdateIPAddressEntryInDB = async ({
    totalIPAddressActivity,
    urlAlias,
    ip,
  }: {
    totalIPAddressActivity: any[];
    urlAlias: string;
    ip: string;
  }) => {
    const currentDate = new Date().toLocaleDateString();
    const existingDateEntry =
      totalIPAddressActivity[totalIPAddressActivity.length - 1]?.date ===
      currentDate
        ? true
        : false;

    if (existingDateEntry) {
      await this.affiliateModel.findOneAndUpdate(
        {
          urlAlias,
          'totalIPAddressActivity.date': currentDate,
        },
        {
          $addToSet: { totalIPAddress: ip },
          $inc: { validClicks: 1 },
          $push: {
            'totalIPAddressActivity.$.ipAddress': ip,
          },
        },
        {
          new: true,
          upsert: true,
        },
      );
    } else {
      await this.affiliateModel.findOneAndUpdate(
        {
          urlAlias,
        },
        {
          $addToSet: { totalIPAddress: ip },
          $inc: { validClicks: 1 },
          $push: {
            totalIPAddressActivity: { date: currentDate, ipAddress: [ip] },
          },
        },
        {
          new: true,
          upsert: true,
        },
      );
    }
  };

  restrictvpn = async (ip) => {
    const proxyCheck = new ProxyCheck({ api_key: process.env.PROXY_CHECK_KEY });
    try {
      const result = await proxyCheck.checkIP(ip, {
        asn: 1,
        vpn: 3,
      });
      const ipResult = result[ip];
      if (ipResult?.proxy === 'yes') {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Error checking IP:', error);
      return false;
    }
  };

  validateIpAddress = async (hasShortUrlDetails, ip) => {
    const { totalIPAddress } = hasShortUrlDetails;
    if (totalIPAddress.includes(ip)) {
      return true;
    }
    return false;
  };

  validateIpAddressActivity = async (hasShortUrlDetails) => {
    const { totalIPAddressActivity } = hasShortUrlDetails;
    const currentDate = new Date().toLocaleDateString();
    const bottomDate =
      totalIPAddressActivity[totalIPAddressActivity?.length - 1]?.date || '';
    if (
      currentDate === bottomDate &&
      totalIPAddressActivity[totalIPAddressActivity.length - 1]?.ipAddress
        ?.length >= 5
    ) {
      return true;
    }
    return false;
  };

  validateIpAddressActivityCount = async (hasShortUrlDetails, ip) => {
    if (await this.restrictvpn(ip)) {
      return true;
    }
    if (await this.validateIpAddress(hasShortUrlDetails, ip)) {
      return true;
    }
    if (await this.validateIpAddressActivity(hasShortUrlDetails)) {
      return true;
    }
    return false;
  };

  recordAndUpdateShortURLMetrics = async ({ hasShortUrlDetails, ip }) => {
    const {
      urlAlias,
      campaignInfoAddress,
      campaignProfileAddress,
      profileAddress,
      totalIPAddressActivity,
    } = hasShortUrlDetails;
    try {
      if (await this.validateIpAddressActivityCount(hasShortUrlDetails, ip)) {
        await this.affiliateModel.updateOne(
          {
            urlAlias,
          },
          { $addToSet: { totalIPAddress: ip }, $inc: { invalidClicks: 1 } },
          { new: true },
        );
        await this.campaignModel.findOneAndUpdate(
          {
            campaignInfoAddress,
          },
          { $inc: { invalidClicks: 1 } },
          { new: true },
        );
      } else {
        await this.handleUserClicksOps.updateClickCount({
          campaignInfoAddress,
          campaignProfileAddress,
          profileAddress,
        });

        await this.insertOrUpdateIPAddressEntryInDB({
          totalIPAddressActivity,
          urlAlias,
          ip,
        });

        await this.campaignModel.findOneAndUpdate(
          {
            campaignInfoAddress,
          },
          { $inc: { validClicks: 1 } },
          { new: true },
        );
      }
    } catch (error) {
      console.error('Error in recordAndUpdateShortURLMetrics:', error);
      return error;
    }
  };

  getShortURL = async (urlAlias: string, ip: string) => {
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
