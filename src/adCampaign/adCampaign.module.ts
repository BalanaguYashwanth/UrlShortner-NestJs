import { Module } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { AffiliateSchema, CampaignSchema } from './adCampaign.model';
import { AdCampaignController } from './adCampaign.controller';
import { AdCampaignService } from './adcampaign.service';
import { ShortnerModule } from 'src/shortner/shortner.module';
import {
  TimeAnalyticsSchema,
  UrlHistorySchema,
} from 'src/shortner/shortner.model';

@Module({
  imports: [
    ShortnerModule,
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
    ThrottlerModule.forRoot([
      {
        ttl: 1,
        limit: 15,
      },
    ]),
  ],
  controllers: [AdCampaignController],
  providers: [
    AdCampaignService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AdCampaignModule {}
