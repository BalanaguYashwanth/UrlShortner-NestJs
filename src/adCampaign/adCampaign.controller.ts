import { Controller, Get, Post, Req ,Query} from '@nestjs/common';
import { AdCampaignService } from './adcampaign.service';

@Controller('ad')
export class AdCampaignController {
  constructor(private readonly adCampaignService: AdCampaignService) {}

  @Get('status')
  status() {
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
  @Post('affiliate/id')
  async affiliateInfo(@Req() req) {
    const {campaignInfoAddress} = req.body;
    return await this.adCampaignService.getCampaignInfoAffiliate(campaignInfoAddress);
  }
  
  @Post(' affiliate/metrics')
  async affiliateTotal(@Req() req) {
    const {campaignInfoAddress} = req.body;
    return await this.adCampaignService.getAffiliateTotal(campaignInfoAddress);
  }
  ////////////affiliates//////////////////
  

  @Post('supporters/create')
  async addSupporters(@Req() req) {
    const data = req.body;
    return await this.adCampaignService.createSupporter(data);
  }
  @Post('supporters/id')
  async getSupportersinfo(@Req() req) {
    const {campaignInfoAddress} = req.body;
    return await this.adCampaignService.getSupporters(campaignInfoAddress);
  
  }
  


  
  
}
