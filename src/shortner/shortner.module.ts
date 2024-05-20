import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { ShortnerController } from './shortner.controller';
import { ShortnerService } from './shortner.service';
import { TimeAnalyticsSchema, UrlHistorySchema } from './shortner.model';
import { AuthModule } from 'src/auth/auth.module';
import { AffiliateSchema } from 'src/adCampaign/adCampaign.model';

@Module({
  imports: [
    AuthModule,
    // CacheModule.register({
    //   store: redisStore,
    //   host: 'localhost',
    //   port: 6379,
    // }),
    MongooseModule.forFeature([
      {
        name: 'Affiliate',
        schema: AffiliateSchema,
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
  providers: [ShortnerService],
  exports: [ShortnerService],
})
export class ShortnerModule {}
