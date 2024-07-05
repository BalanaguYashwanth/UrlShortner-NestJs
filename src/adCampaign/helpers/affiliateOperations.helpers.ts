import { ethers } from 'ethers';
import { getFullnodeUrl, SuiClient } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { ADCAMPAIGN_ABI } from '../ABI/adCampaignABI.base';

export class HandleAffiliateSUIOperations {
  private suiClient;
  private keyPair;
  private provider;
  constructor() {
    // const RPC_ENV = process.env.RPC_ENV as any;
    const url = 'https://sepolia.base.org';
    this.provider = new ethers.providers.JsonRpcProvider(url);
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
          txb.pure.string(walletAddress.slice(2)),
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

  createWalletFromMnemonic(mnemonic: string): string {
    try {
      // Create a wallet from the mnemonic
      const wallet = ethers.Wallet.fromMnemonic(mnemonic);

      // Connect the wallet to the provider
      const connectedWallet = wallet.connect(this.provider);

      return connectedWallet.privateKey;
    } catch (error) {
      console.error('Error creating wallet from mnemonic:', error);
      throw new Error('Invalid mnemonic phrase');
    }
  }

  createAffiliateProfileInBase = async ({
    walletAddress,
    affiliateUID,
    campaignUID,
    campaignUrl,
    originalUrl,
  }: any) => {
    try {
      const mnemonicKey =
        'plunge lemon stone icon best pudding stable milk verify amused bless reason';

      const privateKey = this.createWalletFromMnemonic(mnemonicKey);
      const signer = new ethers.Wallet(privateKey, this.provider);

      const contractAddress = '0x73277A38AE70Cfb9875F6BEF76e2e8c1220415cE';

      const contract = new ethers.Contract(
        contractAddress,
        ADCAMPAIGN_ABI,
        signer,
      );

      console.log(contract.address);
      console.log('---->', {
        walletAddress,
        affiliateUID,
        campaignUID,
        campaignUrl,
        originalUrl,
      });
      const value = await contract.createAffiliate(
        walletAddress,
        affiliateUID,
        campaignUID,
        campaignUrl,
        originalUrl,
      );
      console.log('valie--->', value.toString());
    } catch (error) {
      console.log('----create-affiliate-profile---', error);
      throw error;
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

  getMaxBalanceObjectAddress = (balanceArr, budget) => {
    let coinAddress = '';
    const budgetInt = parseInt(budget);

    for (let i = 0; i < balanceArr.length; i++) {
      const { coinObjectId, balance } = balanceArr[i];
      if (parseInt(balance) == budgetInt) {
        coinAddress = coinObjectId;
        break;
      }
    }

    return coinAddress;
  };

  splitCoin = async ({ budget, receiverAddress }) => {
    try {
      //todo - correct this split logic
      // const txb = new TransactionBlock();
      // const [splittedCoin] = txb.splitCoins(txb.gas, [budget]);
      // txb.transferObjects([splittedCoin, txb.gas], receiverAddress);
      // const response = await this.suiClient.signAndExecuteTransactionBlock({
      //   signer: this.keyPair,
      //   transactionBlock: txb,
      // });
      // console.log('response--->', response);
      // await new Promise((resolve) => setTimeout(resolve, 2000));
      const walletBalanceArr = await this.suiClient.getCoins({
        owner: receiverAddress,
      });

      const address = this.getMaxBalanceObjectAddress(
        walletBalanceArr?.data,
        budget,
      );
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
