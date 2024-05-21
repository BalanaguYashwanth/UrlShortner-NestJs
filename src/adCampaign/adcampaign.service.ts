import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { getFullnodeUrl, SuiClient } from '@mysten/sui.js/client';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { AffiliateDto, CampaignDto } from './adCampaign.dto';
import { ShortnerService } from 'src/shortner/shortner.service';

@Injectable()
export class AdCampaignService {
  private suiClient;
  private keyPair;
  constructor(
    @InjectModel('Campaign')
    private readonly campaignModel: Model<any>,
    private shortnerService: ShortnerService,
    @InjectModel('Affiliate')
    private readonly affiliateModel: Model<any>,
  ) {
    this.suiClient = new SuiClient({ url: getFullnodeUrl('testnet') });
    this.keyPair = Ed25519Keypair.deriveKeypair(process.env.OWNER_MNEMONIC_KEY);
  }

  createCampaign = async (campaignDto: CampaignDto) => {
    await this.campaignModel.create({
      ...campaignDto,
    });
    return { status: 'success' };
  };

  createAffiliate = async (affiliateDto: AffiliateDto) => {
    const {
      campaignUrl,
      campaignInfoAddress,
      originalUrl,
      twitterProfile,
      walletAddress,
      profileAddress,
    } = affiliateDto;
    try {
      let profileTxAddress = profileAddress;
      console.log('profileAddress-->', profileAddress);
      if (!profileAddress) {
        const profileTx = (await this.handleCreateAffiliateProfile(
          campaignInfoAddress,
          twitterProfile,
        )) as any;
        console.log('profileTx--->', profileTx);
        profileTxAddress = profileTx.effects?.created[0]?.reference
          ?.objectId as any;
        console.log('profileTxAddress--->', profileTxAddress);
      }

      const affiliateTx = await this.affiliateCampaignProfile({
        campaignInfoAddress,
        campaignUrl,
        profileAddress: profileTxAddress,
        walletAddress,
      });
      console.log('affiiatetx--->', affiliateTx);
      // const linkTx = await this.linkCampaignProfileToCampaignParentObj(
      //   campaignInfoAddress,
      //   affiliateAddress,
      // );
      // const linkAddress = linkTx.effects?.created[0]?.reference
      //   ?.objectId as any;

      // console.log('linkAddress-->', linkAddress);

      const urlAlias = campaignUrl.split('/')[3];

      //todo - add expiration time
      const affiliateResponse = (await this.affiliateModel.create({
        ...affiliateDto,
        urlAlias,
        linkTxAddress: '',
        profileAddress: profileTxAddress,
        campaignProfileAddress: '',
      })) as any;

      console.log('affiliateResponse--->', affiliateResponse);

      const createShortUrlDto = {
        url: originalUrl,
        shortUrl: campaignUrl,
      };

      await this.shortnerService.createShortURL(
        affiliateResponse._id,
        createShortUrlDto,
      );
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

  handleCreateAffiliateProfile = async (
    campaignInfoAddress: string,
    twitterProfile: string,
  ): Promise<any> => {
    return new Promise<void>((resolve) => {
      const txb = new TransactionBlock();
      txb.moveCall({
        arguments: [
          txb.object(process.env.CAMPAIGN_CONFIG),
          txb.object(campaignInfoAddress),
          txb.pure.string(twitterProfile),
        ],
        target: `${process.env.CAMPAIGN_PACKAGE_ID}::campaign_fund::create_affiliate_profile`,
      });
      const promiseResponse = this.suiClient.signAndExecuteTransactionBlock({
        transactionBlock: txb,
        signer: this.keyPair,
        requestType: 'WaitForLocalExecution',
        options: {
          showEffects: true,
        },
      });
      resolve(promiseResponse as any);
    });
  };

  affiliateCampaignProfile = ({
    campaignInfoAddress,
    profileAddress,
    walletAddress,
  }: any): any => {
    return new Promise((resolve) => {
      console.log('----->', campaignInfoAddress, profileAddress, walletAddress);
      const txb = new TransactionBlock();
      txb.moveCall({
        arguments: [
          txb.object(campaignInfoAddress),
          txb.object(profileAddress),
          txb.pure.address(walletAddress),
        ],
        target: `${process.env.CAMPAIGN_PACKAGE_ID}::campaign_fund::create_affiliate_campaign`,
      });

      const promiseResponse = this.suiClient.signAndExecuteTransactionBlock({
        transactionBlock: txb,
        signer: this.keyPair,
        requestType: 'WaitForLocalExecution',
        options: {
          showEffects: true,
        },
      });
      resolve(promiseResponse);
    });
  };

  linkCampaignProfileToCampaignParentObj = (
    campaignInfoAddress: string,
    affiliateAddress: string,
  ): any => {
    return new Promise((resolve) => {
      const txb = new TransactionBlock();
      txb.moveCall({
        arguments: [
          txb.object(campaignInfoAddress),
          txb.object(affiliateAddress),
        ],
        target: `${process.env.CAMPAIGN_PACKAGE_ID}::campaign_fund::add_affiliate_to_campaign`,
      });

      const promiseResponse = this.suiClient.signAndExecuteTransactionBlock({
        transactionBlock: txb,
        signer: this.keyPair,
        requestType: 'WaitForLocalExecution',
        options: {
          showEffects: true,
        },
      });
      resolve(promiseResponse);
    });
  };
}
