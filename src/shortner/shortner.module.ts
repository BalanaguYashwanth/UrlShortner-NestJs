import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ShortnerController } from './shortner.controller';
import { ShortnerService } from './shortner.service';
import { TimeAnalyticsSchema, UrlHistorySchema } from './shortner.model';
import {
  AffiliateSchema,
  CampaignSchema,
} from 'src/adCampaign/adCampaign.model';
import { HandleUserClicksOps } from './common/handleUserClicksOps.helpers';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'Affiliate',
        schema: AffiliateSchema,
      },
      {
        name: 'Campaign',
        schema: CampaignSchema,
      },
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
  controllers: [ShortnerController],
  providers: [
    ShortnerService,
    HandleUserClicksOps,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  exports: [ShortnerService],
})
export class ShortnerModule {}
