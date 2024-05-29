import { getFullnodeUrl, SuiClient } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';

export class HandleAffiliateSUIOperations {
  private suiClient;
  private keyPair;
  constructor() {
    this.suiClient = new SuiClient({ url: getFullnodeUrl('testnet') });
    this.keyPair = Ed25519Keypair.deriveKeypair(process.env.OWNER_MNEMONIC_KEY);
  }

  createAffiliateCampaignProfile = ({
    campaignInfoAddress,
    campaignUrl,
    profileAddress,
    walletAddress,
  }: any): any => {
    return new Promise((resolve) => {
      const txb = new TransactionBlock();
      txb.moveCall({
        arguments: [
          txb.object(campaignInfoAddress),
          txb.pure.string(campaignUrl),
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

  createAffiliateProfile = async (
    campaignInfoAddress: string,
    campaignUrl: string,
  ): Promise<any> => {
    return new Promise<void>(async (resolve) => {
      const txb = new TransactionBlock();
      txb.moveCall({
        arguments: [
          txb.object(process.env.CAMPAIGN_CONFIG),
          txb.object(campaignInfoAddress),
          txb.pure.string(campaignUrl),
        ],
        target: `${process.env.CAMPAIGN_PACKAGE_ID}::campaign_fund::create_affiliate_profile`,
      });
      const txResponse = this.suiClient.signAndExecuteTransactionBlock({
        transactionBlock: txb,
        signer: this.keyPair,
        requestType: 'WaitForLocalExecution',
        options: {
          showEffects: true,
        },
      });
      const tx = await txResponse;
      resolve(tx?.effects?.created[0]?.reference?.objectId as any);
    });
  };

  updateAffiliateProfile = (
    campaignInfoAddress: string,
    campaignUrl: string,
    profileAddress: string,
  ) => {
    return new Promise<void>((resolve) => {
      const txb = new TransactionBlock();
      txb.moveCall({
        arguments: [
          txb.object(campaignInfoAddress),
          txb.pure.string(campaignUrl),
          txb.object(profileAddress),
        ],
        target: `${process.env.CAMPAIGN_PACKAGE_ID}::campaign_fund::update_affiliate_profile`,
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
}

export const affiliateSaveIntoDB = async ({
  affiliateModel,
  affiliateDto,
  profileTxAddress,
  shortnerService,
}) => {
  const { campaignUrl, campaignInfoAddress, originalUrl, walletAddress } =
    affiliateDto;
  //todo - check is it working properly or not
  await new HandleAffiliateSUIOperations().createAffiliateCampaignProfile({
    campaignInfoAddress,
    campaignUrl,
    profileAddress: profileTxAddress,
    walletAddress,
  });

  const affiliateResponse = (await affiliateModel.create({
    ...affiliateDto,
    urlAlias: campaignUrl.split('/')[3],
    profileAddress: profileTxAddress,
  })) as any;

  const createShortUrlDto = {
    url: originalUrl,
    shortUrl: campaignUrl,
  };

  await shortnerService.createShortURL(
    affiliateResponse._id,
    createShortUrlDto,
  );
};

export const getAffiliateCampaignDetails = async ({
  affiliateModel,
  campaignInfoAddress,
  profileAddress,
  walletAddress,
}) => {
  const details = await affiliateModel.findOne({
    campaignInfoAddress,
    profileAddress,
    walletAddress,
  });
  return details;
};
