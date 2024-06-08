import { Controller, Post, Body, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { SearchBotService } from './searchBot.service';

@Controller('search-bot-query')
export class SearchBotController {
  constructor(private readonly SearchBotService: SearchBotService) {}

  @Post()
  async SearchBot(@Body('queryText') queryText: string, @Res() res: Response) {
    try {
      const textResults = await this.SearchBotService.searchBot(queryText);
      return res.json({ results: textResults });
    } catch (error) {
      console.error('Error querying Kendra:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Error querying Kendra' });
    }
  }
}
