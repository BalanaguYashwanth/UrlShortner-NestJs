import { Controller, Get, Post, Req, HttpException } from '@nestjs/common';
import { AdCampaignService } from './adcampaign.service';

@Controller('ad')
export class AdCampaignController {
  constructor(private readonly adCampaignService: AdCampaignService) {}

  @Get('status')
  status() {
    return { status: 'running' };
  }

  @Post('split-coin')
  async handleSplitCoin(@Req() req) {
    try {
      const { budget, receiverAddress } = req.body;
      const address = await this.adCampaignService.splitCoinService({
        budget,
        receiverAddress,
      });

      return { address };
    } catch (err) {
      throw new HttpException(
        {
          status: 400,
          error: 'bad request',
          message: err.message,
        },
        400,
      );
    }
  }

  ////////////campaigns//////////////////
  @Get('campaigns')
  async campaigns(@Req() req) {
    const { page, limit, category, sortBy } = req.query;
    const { campaigns, totalPages } =
      await this.adCampaignService.getCampaignsByPage(
        page,
        limit,
        category,
        sortBy,
      );
    return { campaigns, totalPages };
  }

  @Post('campaigns/id')
  async campaignById(@Req() req) {
    const { campaignInfoAddress } = req.body;
    return await this.adCampaignService.getCampaignById(campaignInfoAddress);
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
    try {
      const data = req.body;
      const responseData = await this.adCampaignService.createAffiliate(data);
      return { campaignUrl: responseData?.campaignUrl };
    } catch (err) {
      throw new HttpException(
        {
          status: 400,
          error: 'bad request',
          message: err.message,
        },
        400,
      );
    }
  }

  @Post('affiliate/profile')
  async affiliateProfile(@Req() req) {
    const data = req.body;
    return await this.adCampaignService.getAffiliateProfile(data);
  }
  @Post('affiliate/id')
  async affiliateByCampaignId(@Req() req) {
    const { campaignInfoAddress } = req.body;
    return await this.adCampaignService.getCampaignInfoAffiliate(
      campaignInfoAddress,
    );
  }

  @Post('affiliate/metrics')
  async affiliateTotal(@Req() req) {
    const { campaignInfoAddress } = req.body;
    return await this.adCampaignService.getAffiliateMetricsByID(
      campaignInfoAddress,
    );
  }
  ////////////affiliates//////////////////

  ////////////supporters//////////////////
  @Post('supporters/create')
  async addSupporters(@Req() req) {
    const data = req.body;
    return await this.adCampaignService.createSupporter(data);
  }
  @Post('supporters/id')
  async getSupportersinfo(@Req() req) {
    const { campaignInfoAddress } = req.body;
    return await this.adCampaignService.getSupportersByCampaignId(
      campaignInfoAddress,
    );
  }
  ////////////supporters//////////////////

  @Post('update-likes')
  async like(@Req() req) {
    const data = req.body;
    return await this.adCampaignService.updateLike(data);
  }
}
