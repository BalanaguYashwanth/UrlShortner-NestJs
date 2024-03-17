import { Module } from '@nestjs/common';
import { ShortnerController } from './shortner.controller';
import { ShortnerService } from './shortner.service';
import { MongooseModule } from '@nestjs/mongoose';
import { TimeAnalyticsSchema, UrlHistorySchema } from './shortner.model';

@Module({
  imports: [
    MongooseModule.forFeature([
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
})
export class ShortnerModule {}
