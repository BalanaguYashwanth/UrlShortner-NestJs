import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { getFullnodeUrl, SuiClient } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';

@Injectable()
export class HandleUserClicksOps {
  private readonly noPageFound = null;
  private suiClient;
  private keyPair;
  constructor(
    @InjectModel('Campaign')
    private readonly campaignModel: Model<any>,
  ) {
    this.suiClient = new SuiClient({ url: getFullnodeUrl('mainnet') });
    this.keyPair = Ed25519Keypair.deriveKeypair(process.env.OWNER_MNEMONIC_KEY);
  }

  updateClickCount = async ({ campaignInfoAddress, profileAddress }: any) => {
    try {
      const txb = new TransactionBlock();
      txb.moveCall({
        arguments: [
          txb.object(campaignInfoAddress),
          txb.object(profileAddress),
        ],
        target: `${process.env.CAMPAIGN_PACKAGE_ID}::campaign_fund::update_affiliate_via_campaign`,
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
    } catch (error) {
      console.log('updateClickCount error====>', error);
      throw error;
    }
  };

  endCampaign = async (campaignInfoAddress: string) => {
    try {
      const txb = new TransactionBlock();
      txb.moveCall({
        arguments: [txb.object(campaignInfoAddress)],
        target: `${process.env.CAMPAIGN_PACKAGE_ID}::campaign_fund::end_campaign`,
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
    } catch (err) {
      console.log('err=====>', err);
    }
  };

  updateClickExpire = async (campaignInfoAddress: string) => {
    try {
      const { status } = await this.campaignModel.findOne({
        campaignInfoAddress,
      });
      if (status === 3) {
        return true;
      }
      await this.endCampaign(campaignInfoAddress);
      await this.campaignModel.updateOne(
        { campaignInfoAddress },
        {
          $set: {
            status: 3,
          },
        },
      );
    } catch (e) {
      console.log('e=====>', e);
      return true;
    }
  };
}
