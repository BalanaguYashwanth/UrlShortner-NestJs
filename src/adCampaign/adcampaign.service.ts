import * as moment from 'moment';
import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import {
  AffiliateDto,
  CampaignDto,
  SupportersDto,
  UpdateLikeDto,
} from './adCampaign.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';
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
        cpc: 1,
      },
    );

    const sortedData = data.sort((a, b) => {
      const earningA = a.cpc * a.validClicks;
      const earningB = b.cpc * b.validClicks;

      if (earningA !== earningB) {
        return earningB - earningA;
      }

      const totalClicksA = a.validClicks + a.invalidClicks;
      const totalClicksB = b.validClicks + b.invalidClicks;

      return totalClicksB - totalClicksA;
    });

    const transformedData = transformAffiliateData(sortedData);
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

  async getCampaignsByPage(
    page: number,
    limit: number,
    category = '',
    sortBy = '',
  ): Promise<any> {
    page = Number(page);
    limit = Number(limit);

    const skip = (page - 1) * limit;
    let sortQuery: any = { createdAt: -1 };

    if (sortBy) {
      if (sortBy === 'Rates Per Click') {
        sortQuery = { cpc: -1 };
      } else if (sortBy === 'Time Left') {
        sortQuery = { endDate: 1 };
      } else if (sortBy === 'Budget Left') {
        sortQuery = { budgetLeft: -1 };
      } else if (sortBy === 'Likes Count') {
        sortQuery = { likesCount: -1 };
      }
    }

    let filterQuery: any = {};
    if (category && category !== 'All') {
      if (category === 'Others') {
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
              'SUI Overflow',
            ],
          },
        };
      } else {
        filterQuery = { category };
      }
    }

    const totalCampaigns = await this.campaignModel
      .countDocuments(filterQuery)
      .exec();
    const totalPages = Math.ceil(totalCampaigns / limit);

    const campaigns = await this.campaignModel.aggregate([
      { $match: filterQuery },
      {
        $addFields: {
          budgetLeft: {
            $subtract: [
              '$campaignBudget',
              { $multiply: ['$cpc', '$validClicks'] },
            ],
          },
          likesCount: { $size: { $ifNull: ['$likes', []] } },
        },
      },
      { $sort: sortQuery },
      { $skip: skip },
      { $limit: limit },
    ]);

    return { campaigns, totalPages };
  }

  splitCoinService = async (data) => {
    try {
      const address = await new HandleAffiliateSUIOperations().splitCoin(data);
      return address;
    } catch (err) {
      return 'unable to split';
    }
  };

  async updateLike(updateLikeDto: UpdateLikeDto) {
    const { campaignId, userId, type } = updateLikeDto;

    const campaign = await this.campaignModel.findOne({
      campaignInfoAddress: campaignId,
    });
    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }
    if (type === 'like') {
      if (campaign.likes.includes(userId)) {
        campaign.likes = campaign.likes.filter((id) => id !== userId);
      } else {
        campaign.dislikes = campaign.dislikes.filter((id) => id !== userId);
        if (!campaign.dislikes.includes(userId)) {
          campaign.likes.push(userId);
        }
      }
    } else if (type === 'dislike') {
      if (campaign.dislikes.includes(userId)) {
        campaign.dislikes = campaign.dislikes.filter((id) => id !== userId);
      } else {
        campaign.likes = campaign.likes.filter((id) => id !== userId);
        if (!campaign.likes.includes(userId)) {
          campaign.dislikes.push(userId);
        }
      }
    } else {
      throw new BadRequestException('Invalid type');
    }

    await campaign.save();
    return {
      likes: campaign?.likes?.length,
      dislikes: campaign?.dislikes?.length,
    };
  }
}
