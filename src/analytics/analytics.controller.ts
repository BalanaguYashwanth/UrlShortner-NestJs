import { Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtGuard } from 'src/auth/guards/jwt-auth.guards';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post()
  @UseGuards(JwtGuard)
  async getAnalytics(@Req() req) {
    const { id } = req.user;
    return await this.analyticsService.urlAnalytics(id);
  }
}
