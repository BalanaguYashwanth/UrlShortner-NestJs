import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ShortnerController } from './shortner.controller';
import { ShortnerService } from './shortner.service';
import { TimeAnalyticsSchema, UrlHistorySchema } from './shortner.model';
import { AuthModule } from 'src/auth/auth.module';
import {
  AffiliateSchema,
  CampaignSchema,
} from 'src/adCampaign/adCampaign.model';
import { HandleUserClicksOps } from './common/handleUserClicksOps.helpers';
import { QueueModule } from 'src/queue/queue.module';

@Module({
  imports: [
    AuthModule,
    forwardRef(() => QueueModule),
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
  ],
  controllers: [ShortnerController],
  providers: [ShortnerService, HandleUserClicksOps],
  exports: [ShortnerService],
})
export class ShortnerModule {}
