import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AdCampaignModule } from './adCampaign/adCampaign.module';
import { SearchBotModule } from './searchBot/searchBot.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(process.env.MONGO_URI),
    AdCampaignModule,
    SearchBotModule,
  ],
  providers: [],
})
export class AppModule {}
