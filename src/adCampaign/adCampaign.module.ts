import { Module } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import {
  AffiliateSchema,
  CampaignSchema,
  SupportersSchema,
} from './adCampaign.model';
import { AdCampaignController } from './adCampaign.controller';
import { AdCampaignService } from './adcampaign.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'Campaign',
        schema: CampaignSchema,
      },
      {
        name: 'Affiliate',
        schema: AffiliateSchema,
      },
      {
        name: 'Supporters',
        schema: SupportersSchema,
      },
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
