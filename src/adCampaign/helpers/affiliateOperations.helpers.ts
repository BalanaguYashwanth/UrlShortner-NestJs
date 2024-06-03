import { getFullnodeUrl, SuiClient } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';

export class HandleAffiliateSUIOperations {
  private suiClient;
  private keyPair;
  constructor() {
    // const RPC_ENV = process.env.RPC_ENV as any;
    this.suiClient = new SuiClient({ url: getFullnodeUrl('testnet') });
    this.keyPair = Ed25519Keypair.deriveKeypair(process.env.OWNER_MNEMONIC_KEY);
  }

  createAffiliateCampaignProfile = async ({
    campaignInfoAddress,
    campaignUrl,
    profileAddress,
    walletAddress,
  }: any) => {
    try {
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

      const promiseResponse =
        await this.suiClient.signAndExecuteTransactionBlock({
          transactionBlock: txb,
          signer: this.keyPair,
          requestType: 'WaitForLocalExecution',
          options: {
            showEffects: true,
          },
        });
      await promiseResponse;
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (err) {
      console.log('-----createAffiliateCampaignProfile---err--->', err);
      throw new Error(err);
    }
  };

  createAffiliateProfile = async (
    campaignInfoAddress: string,
    campaignUrl: string,
  ) => {
    try {
      const txb = new TransactionBlock();
      txb.moveCall({
        arguments: [
          txb.object(campaignInfoAddress),
          txb.pure.string(campaignUrl),
        ],
        target: `${process.env.CAMPAIGN_PACKAGE_ID}::campaign_fund::create_affiliate_profile`,
      });
      const txResponse = await this.suiClient.signAndExecuteTransactionBlock({
        transactionBlock: txb,
        signer: this.keyPair,
        requestType: 'WaitForLocalExecution',
        options: {
          showEffects: true,
        },
      });
      const tx = await txResponse;
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return tx?.effects?.created[0]?.reference?.objectId;
    } catch (error) {
      console.log('----create-affiliate-profile---', error);
      throw error;
    }
  };

  updateAffiliateProfile = async (
    campaignInfoAddress: string,
    campaignUrl: string,
    profileAddress: string,
  ) => {
    try {
      const txb = new TransactionBlock();
      txb.moveCall({
        arguments: [
          txb.object(campaignInfoAddress),
          txb.pure.string(campaignUrl),
          txb.object(profileAddress),
        ],
        target: `${process.env.CAMPAIGN_PACKAGE_ID}::campaign_fund::update_affiliate_profile`,
      });
      const txResponse = await this.suiClient.signAndExecuteTransactionBlock({
        transactionBlock: txb,
        signer: this.keyPair,
        requestType: 'WaitForLocalExecution',
        options: {
          showEffects: true,
        },
      });
      const tx = await txResponse;
      await new Promise((resolve) => setTimeout(resolve, 2000));
      console.log('updateAffiliateProfile---tx--->', tx);
    } catch (err) {
      throw new Error(err);
    }
  };

  getMaxBalanceObjectAddress = (balanceArr: any[], budget) => {
    let coinAddress = '';
    balanceArr.forEach(
      ({
        coinObjectId,
        balance,
      }: {
        coinObjectId: string;
        balance: string;
      }) => {
        console.log('balance---->', balance, 'budget-----', budget);
        if (parseInt(balance) == parseInt(budget)) {
          coinAddress = coinObjectId;
          return;
        }
      },
    );
    return coinAddress;
  };

  splitCoin = async ({ budget, receiverAddress }) => {
    try {
      const txb = new TransactionBlock();
      const [splittedCoin] = txb.splitCoins(txb.gas, [budget]);
      console.log(
        'splittedCoin-->',
        splittedCoin,
        'receiverAddress->',
        receiverAddress,
      );
      txb.transferObjects([splittedCoin, txb.gas], receiverAddress);
      await this.suiClient.signAndExecuteTransactionBlock({
        signer: this.keyPair,
        transactionBlock: txb,
      });
      const walletBalanceArr = await this.suiClient.getCoins({
        owner: receiverAddress,
      });
      console.log('walletBalanceArr--->', walletBalanceArr);
      const address = this.getMaxBalanceObjectAddress(walletBalanceArr, budget);
      return address;
    } catch (err) {
      throw new Error(err);
    }
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
