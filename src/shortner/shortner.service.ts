import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

import { getFullnodeUrl, SuiClient } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';

import { Cache } from 'cache-manager';
import { Model } from 'mongoose';
import { CreateShortUrlDto } from './shortner.dto';
import { TimeAnalyticsProps, UrlHistoryProps } from './shortner.model';
import { checkUrlExpiration, mapUserAgentToDeviceInfo } from './helpers';

@Injectable()
export class ShortnerService {
  private readonly DOMAIN = process.env.DOMAIN || 'http://localhost:3000';
  private readonly noPageFound = null;
  private suiClient;
  private keyPair;
  constructor(
    @InjectModel('Affiliate')
    private readonly affiliateModel: Model<any>,
    @InjectModel('UrlHistory')
    private readonly urlHistoryModel: Model<UrlHistoryProps>,
    @InjectModel('TimeAnalytics')
    private readonly timeAnalyticsModel: Model<TimeAnalyticsProps>,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {
    this.suiClient = new SuiClient({ url: getFullnodeUrl('testnet') });
    this.keyPair = Ed25519Keypair.deriveKeypair(process.env.OWNER_MNEMONIC_KEY);
  }

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
    console.log('createShortUrlDto--', createShortUrlDto);
    const { expirationTime = null, url, shortUrl } = createShortUrlDto;
    const shortAlias = shortUrl.split('/')[3];
    console.log('------>', shortAlias);
    // const shortUrl = `${this.DOMAIN}/${shortAlias}`;
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

  private createRedisCache = async (key: string, value: any): Promise<void> => {
    await this.cacheManager.set(key, value, 300000);
  };

  updateClickCount = ({
    campaignInfoAddress,
    campaignProfileAddress,
    profileAddress,
  }: any) => {
    return new Promise<void>((resolve) => {
      const txb = new TransactionBlock();
      txb.moveCall({
        arguments: [
          txb.object(campaignInfoAddress),
          txb.object(campaignProfileAddress),
          txb.object(profileAddress),
        ],
        target: `${process.env.CAMPAIGN_PACKAGE_ID}::campaign_fund::click_counter`,
      });
      const promiseResponse = this.suiClient.signAndExecuteTransactionBlock({
        transactionBlock: txb,
        signer: this.keyPair,
        requestType: 'WaitForLocalExecution',
        options: {
          showEffects: true,
        },
      });
      resolve(promiseResponse as any);
    });
  };

  getShortURL = async (shortAlias: string, ref: string, userAgent: string) => {
    const hasShortUrlDetails = await this.affiliateModel.findOne({
      urlAlias: shortAlias,
    });

    const {
      campaignInfoAddress,
      // linkTxAddress,
      campaignProfileAddress,
      profileAddress,
      originalUrl,
      expirationTime = null,
    } = hasShortUrlDetails as any;

    if (checkUrlExpiration(expirationTime)) {
      return this.noPageFound;
    }

    const response = await this.updateClickCount({
      campaignInfoAddress,
      campaignProfileAddress,
      profileAddress,
    });

    console.log('response--->', response);

    return originalUrl;
  };
}
