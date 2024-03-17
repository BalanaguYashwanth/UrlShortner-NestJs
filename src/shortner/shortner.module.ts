import { Module } from '@nestjs/common';
import { ShortnerController } from './shortner.controller';
import { ShortnerService } from './shortner.service';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsSchema, ShortUrlSchema } from './shortner.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'ShortUrlModel', schema: ShortUrlSchema },
      { name: 'Analytics', schema: AnalyticsSchema },
    ]),
  ],
  controllers: [ShortnerController],
  providers: [ShortnerService],
})
export class ShortnerModule {}
