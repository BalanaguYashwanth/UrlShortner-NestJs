import { getFullnodeUrl, SuiClient } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AffiliateProfileService {
  private suiClient;
  private keyPair;
  constructor() {
    this.suiClient = new SuiClient({ url: getFullnodeUrl('mainnet') });
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
      await txResponse;
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (err) {
      throw new Error(err);
    }
  };
}
