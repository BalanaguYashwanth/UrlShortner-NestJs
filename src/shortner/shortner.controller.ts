import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard } from 'src/auth/guards/jwt-auth.guards';
import { ShortnerService } from './shortner.service';
import { CreateShortUrlDto } from './shortner.dto';

@Controller('/')
export class ShortnerController {
  constructor(private readonly shortnerService: ShortnerService) {}

  @Post()
  // @UseGuards(JwtGuard)
  async createLink(@Body() createShortUrlDto: CreateShortUrlDto, @Req() req) {
    try {
      const { id } = req.user;
      const url = await this.shortnerService.createShortURL(
        id,
        createShortUrlDto,
      );
      return { data: url };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get(':id')
  async getLink(
    @Param('id') id: string,
    @Query('ref') ref = 'direct',
    @Req() req,
    @Res() res,
  ) {
    const userAgent = req.headers['user-agent'] || '';
    const url = await this.shortnerService.getShortURL(id, ref, userAgent);
    if (url) {
      res.redirect(url);
    } else {
      res.send(404);
    }
  }
}
