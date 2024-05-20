import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AffiliateSchema, CampaignSchema } from './adCampaign.model';
import { AdCampaignController } from './adCampaign.controller';
import { AdCampaignService } from './adcampaign.service';
import { ShortnerModule } from 'src/shortner/shortner.module';
import {
  TimeAnalyticsSchema,
  UrlHistorySchema,
} from 'src/shortner/shortner.model';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';

@Module({
  imports: [
    ShortnerModule,
    // CacheModule.register({
    //   store: redisStore,
    //   host: 'localhost',
    //   port: 6379,
    // }),
    MongooseModule.forFeature([
      {
        name: 'Campaign',
        schema: CampaignSchema,
      },
      {
        name: 'Affiliate',
        schema: AffiliateSchema,
      },
    ]),
    MongooseModule.forFeature([
      {
        name: 'UrlHistory',
        schema: UrlHistorySchema,
        collection: 'urlhistory',
      },
      { name: 'TimeAnalytics', schema: TimeAnalyticsSchema },
    ]),
  ],
  controllers: [AdCampaignController],
  providers: [AdCampaignService],
})
export class AdCampaignModule {}
