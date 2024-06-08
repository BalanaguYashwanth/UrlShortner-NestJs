import { Module } from '@nestjs/common';
import { SearchBotController } from './searchBot.controller';
import { SearchBotService } from './searchBot.service';

@Module({
  controllers: [SearchBotController],
  providers: [SearchBotService],
})
export class SearchBotModule {}
