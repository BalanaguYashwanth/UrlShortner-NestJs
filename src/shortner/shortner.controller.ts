import { Controller, Get, Param, Req, Res } from '@nestjs/common';
import { ShortnerService } from './shortner.service';

@Controller('/')
export class ShortnerController {
  constructor(private readonly shortnerService: ShortnerService) {}

  @Get(':id')
  async getLink(@Param('id') id: string, @Req() req, @Res() res) {
    const ip =
      req.headers['cf-connecting-ip'] ||
      req.headers['x-real-ip'] ||
      req.headers['x-forwarded-for'] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress;
    const url = await this.shortnerService.getShortURL(id, ip);
    if (url) {
      res.redirect(url);
    } else {
      res.setHeader('Cache-Control', 'no-store');
      return res.sendStatus(404);
    }
  }
}
