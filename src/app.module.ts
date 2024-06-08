import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ShortnerModule } from './shortner/shortner.module';
import { AdCampaignModule } from './adCampaign/adCampaign.module';
import { QueueModule } from './queue/queue.module';
import { SearchBotModule } from './searchBot/searchBot.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(process.env.MONGO_URI),
    AdCampaignModule,
    ShortnerModule,
    QueueModule,
    SearchBotModule,
  ],
  providers: [],
})
export class AppModule {}
