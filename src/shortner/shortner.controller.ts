import { Body, Controller, Get, Param, Post, Res } from '@nestjs/common';
import { ShortnerService } from './shortner.service';
import { CreateShortUrlDto } from './shortner.dto';

//Todo - We need to send the userId to this createShortService
@Controller('/')
export class ShortnerController {
  constructor(private readonly shortnerService: ShortnerService) {}

  @Post()
  async createLink(@Body() createShortUrlDto: CreateShortUrlDto) {
    const url = await this.shortnerService.createShortURL(createShortUrlDto);
    return { data: url };
  }

  @Get(':id')
  async getLink(@Param('id') id: string, @Res() res) {
    const url = await this.shortnerService.getShortURL(id);
    res.redirect(url);
  }
}
