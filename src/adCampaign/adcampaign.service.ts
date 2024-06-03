import * as moment from 'moment';
import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { AffiliateDto, CampaignDto, SupportersDto } from './adCampaign.dto';
import { ShortnerService } from 'src/shortner/shortner.service';
import {
  affiliateSaveIntoDB,
  getAffiliateCampaignDetails,
  HandleAffiliateSUIOperations,
} from './helpers/affiliateOperations.helpers';
import { transformAffiliateData } from 'src/shortner/helpers';

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

  createSupporter = async (supportersDto: SupportersDto) => {
    const { campaignInfoAddress, coins } = supportersDto;
    await this.campaignModel.updateOne(
      {
        campaignInfoAddress,
      },
      {
        $inc: {
          campaignBudget: parseFloat(coins),
        },
      },
    );
    await this.supportersModel.create({
      ...supportersDto,
    });
    return { status: 'success' };
  };

  getSupportersByCampaignId = async (campaignInfoAddress: string) => {
    const data = await this.supportersModel.find(
      { campaignInfoAddress },
      {
        _id: 0,
        walletAddress: 1,
        message: 1,
        coins: 1,
        transactionDigest: 1,
      },
    );
    return data;
  };

  createAffiliate = async (affiliateDto: AffiliateDto) => {
    //todo - check endtime and allow this request
    const {
      campaignInfoAddress,
      campaignUrl,
      profileAddress,
      walletAddress,
      expirationTime,
    } = affiliateDto;
    const currentTime = moment().unix();

    if (currentTime > parseInt(expirationTime)) {
      throw new Error('campaign already expired');
    }

    try {
      const hasAffiliateExists = (await getAffiliateCampaignDetails({
        affiliateModel: this.affiliateModel,
        campaignInfoAddress,
        profileAddress,
        walletAddress,
      })) as any;
      if (hasAffiliateExists) {
        return { campaignUrl: hasAffiliateExists.campaignUrl };
      }

      let profileTxAddress = profileAddress;
      console.log('profileTxAddress---before-->', profileTxAddress);
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
      console.log('profileAddress--after-->', profileTxAddress);
      await affiliateSaveIntoDB({
        affiliateModel: this.affiliateModel,
        affiliateDto,
        profileTxAddress,
        shortnerService: this.shortnerService,
      });
      console.log('---------result-------');
      return { campaignUrl: affiliateDto.campaignUrl };
    } catch (err) {
      console.log('err--->', err);
      throw new Error(err);
    }
  };

  getCampaignById = async (campaignInfoAddress: string) => {
    const response = await this.campaignModel.find({ campaignInfoAddress });
    return response;
  };

  getAffiliateProfile = async (affiliateDto: AffiliateDto) => {
    const { walletAddress } = affiliateDto;
    const response = await this.affiliateModel.find({ walletAddress });
    return response;
  };

  getCampaignInfoAffiliate = async (campaignInfoAddress: string) => {
    const data = await this.affiliateModel.find(
      { campaignInfoAddress },
      {
        _id: 0,
        walletAddress: 1,
        validClicks: 1,
        invalidClicks: 1,
      },
    );

    const transformedData = transformAffiliateData(data);
    return transformedData;
  };

  //todo - add total clicks  = valid clicks + invalid clicks
  getAffiliateMetricsByID = async (campaignInfoAddress: string) => {
    const aggregateQuery = [
      {
        $match: { campaignInfoAddress },
      },
      {
        $group: {
          _id: null,
          totalValidClicks: { $sum: '$validClicks' },
          totalInValidClicks: { $sum: '$invalidClicks' },
        },
      },
    ];
    const response = await this.affiliateModel.aggregate(aggregateQuery);
    return {
      totalClicks:
        response[0]?.totalValidClicks + response[0]?.totalInValidClicks || 0,
    };
  };

  getCampaignsByPage = async (
    page: number,
    limit: number,
    category: string = '',
    sortBy: string = '',
  ) => {
    const skip = (page - 1) * limit;

    let sortQuery: any = { createdAt: -1 };
    if (sortBy) {
      if (sortBy === 'Rates Per Click') {
        sortQuery = { cpc: -1 };
      } else if (sortBy === 'Time Left') {
        sortQuery = { endDate: 1 };
      } else if (sortBy === 'Budget Left') {
        sortQuery = { budget: -1 };
      }
    }

    let filterQuery: any = {};
    if (category && category !== 'Others') {
      filterQuery = { category };
    } else if (category === 'Others') {
      filterQuery = {
        category: {
          $nin: [
            'Defi',
            'NFT',
            'Social',
            'Marketplace',
            'Meme Coin',
            'Dev Tooling',
            'Wallets',
            'DAO',
            'Gaming',
            'Bridge',
            'DEX',
          ],
        },
      };
    }
    const totalCampaigns = await this.campaignModel.countDocuments(filterQuery);
    const totalPages = Math.ceil(totalCampaigns / limit);
    const campaigns = await this.campaignModel
      .find(filterQuery)
      .sort(sortQuery)
      .skip(skip)
      .limit(limit);
    return { campaigns, totalPages };
  };

  splitCoinService = async (data) => {
    try {
      const address = await new HandleAffiliateSUIOperations().splitCoin(data);
      return address;
    } catch (err) {
      return 'unable to split';
    }
  };
}
