import { Controller, Get, Post, Req } from '@nestjs/common';
import { AdCampaignService } from './adcampaign.service';

@Controller('ad')
export class AdCampaignController {
  constructor(private readonly adCampaignService: AdCampaignService) {}

  @Get('status')
  async status() {
    return { status: 'running' };
  }

  ////////////campaigns//////////////////
  @Get('campaigns')
  async campaigns() {
    return await this.adCampaignService.getCampaigns();
  }

  @Post('campaign/create')
  async createCampaign(@Req() req) {
    const data = req.body;
    return await this.adCampaignService.createCampaign(data);
  }
  ////////////campaigns//////////////////

  ////////////affiliates//////////////////
  @Post('affiliate/create')
  async createAffiliate(@Req() req) {
    const data = req.body;
    return await this.adCampaignService.createAffiliate(data);
  }

  @Post('affiliate/profile')
  async affiliateProfile(@Req() req) {
    const data = req.body;
    return await this.adCampaignService.getAffiliateProfile(data);
  }
  ////////////affiliates//////////////////
}
