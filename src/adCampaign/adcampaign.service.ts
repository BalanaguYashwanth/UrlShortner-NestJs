import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { AffiliateDto, CampaignDto } from './adCampaign.dto';
import { ShortnerService } from 'src/shortner/shortner.service';
import {
  HandleAffiliateSUIOperations,
  affiliateSaveIntoDB,
} from './helpers/affiliateOperations.helpers';

@Injectable()
export class AdCampaignService {
  constructor(
    @InjectModel('Campaign')
    private readonly campaignModel: Model<any>,
    private shortnerService: ShortnerService,
    @InjectModel('Affiliate')
    private readonly affiliateModel: Model<any>,
  ) {}

  createCampaign = async (campaignDto: CampaignDto) => {
    await this.campaignModel.create({
      ...campaignDto,
    });
    return { status: 'success' };
  };

  createAffiliate = async (affiliateDto: AffiliateDto) => {
    const { campaignInfoAddress, campaignUrl, profileAddress } = affiliateDto;
    try {
      let profileTxAddress = profileAddress;

      if (!profileTxAddress) {
        profileTxAddress =
          (await new HandleAffiliateSUIOperations().createAffiliateProfile(
            campaignInfoAddress,
            campaignUrl,
          )) as any;
      } else {
        await new HandleAffiliateSUIOperations().updateAffiliateProfile(
          campaignInfoAddress,
          campaignUrl,
          profileAddress,
        );
      }

      await affiliateSaveIntoDB({
        affiliateModel: this.affiliateModel,
        affiliateDto,
        profileTxAddress,
        shortnerService: this.shortnerService,
      });

      return { campaignUrl: affiliateDto.campaignUrl };
    } catch (err) {
      console.log('err--->', err);
    }
  };

  getCampaigns = async () => {
    const response = await this.campaignModel.find({});
    return response;
  };

  getAffiliateProfile = async (affiliateDto: AffiliateDto) => {
    const { walletAddress } = affiliateDto;
    const response = await this.affiliateModel.find({ walletAddress });
    return response;
  };
}
