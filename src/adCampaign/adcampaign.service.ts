import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { AffiliateDto, CampaignDto,SupportersDto} from './adCampaign.dto';
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
    @InjectModel('Supporters')
    private readonly supportersModel: Model<any>,
    
  ) {}
  
  
  
  
  createCampaign = async (campaignDto: CampaignDto) => {
    await this.campaignModel.create({
      ...campaignDto,
    });
    return { status: 'success' };
  };


  createSupporter = async (SupportersDto: SupportersDto) => {
    await this.supportersModel.create({
      ...SupportersDto,
    });
    return { status: 'success' };
  };

  getSupporters=async(campaignInfoAddress: string)=> {
    const data= await this.supportersModel.find({ campaignInfoAddress:campaignInfoAddress });
    return data;
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

  getCampaignInfoAffiliate = async (campaignInfoAddress: string) => {
    const response = await this.affiliateModel.find({ campaignInfoAddress });
    return response;
  };
  getAffiliateTotal = async (campaignInfoAddress: string) => {
    const response = await this.affiliateModel.aggregate([
      {
        $match: { campaignInfoAddress }
      },
      {
        $group: {
          _id: null,
          totalValidClicks: { $sum: "$validClicks" }
        }
      }
    ]);
  
    return response.length > 0 ? response[0].totalValidClicks : 0;
  };
  

}
