import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { getHttpEndpoint } from '@orbs-network/ton-access';
import { getFullnodeUrl, SuiClient } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import {
  Address,
  beginCell,
  internal,
  SendMode,
  toNano,
  TonClient,
  WalletContractV4,
} from 'ton';
import { mnemonicToPrivateKey } from '@ton/crypto';

@Injectable()
export class HandleUserClicksOps {
  private readonly noPageFound = null;
  private suiClient;
  private keyPair;
  constructor(
    @InjectModel('Affiliate')
    private readonly affiliateModel: Model<any>,
    @InjectModel('Campaign')
    private readonly campaignModel: Model<any>,
  ) {
    // const RPC_ENV = process.env.RPC_ENV as any;
    this.suiClient = new SuiClient({ url: getFullnodeUrl('mainnet') });
    this.keyPair = Ed25519Keypair.deriveKeypair(process.env.OWNER_MNEMONIC_KEY);
  }

  sendWithdrawRequest = async (
    affiliateAddress: string,
    gasFees: bigint,
    cpc: bigint,
  ) => {
    const client = new TonClient({
      endpoint: await getHttpEndpoint({
        network: (process.env.TON_ENV || 'testnet') as any,
      }),
    });

    const mnemonics = process.env.TON_OWNER_MNEMONIC_KEY;
    const keyPair = await mnemonicToPrivateKey(mnemonics.split(' '));

    const workchain = 0;
    const wallet = WalletContractV4.create({
      workchain,
      publicKey: keyPair.publicKey,
    });

    const msgBody = beginCell()
      .storeUint(3, 32) // Operation ID
      .storeCoins(cpc) // Amount to withdraw
      .storeAddress(Address.parse(affiliateAddress)) // Your wallet address to receive the funds
      .endCell();

    // Create the internal message to send to the contract
    const internalMessage = internal({
      value: gasFees,
      to: Address.parse(process.env.TON_CONTRACT_ADDRESS),
      body: msgBody,
    });

    // Create the transaction
    const seqno: number = await client
      .open(
        WalletContractV4.create({ workchain: 0, publicKey: keyPair.publicKey }),
      )
      .getSeqno();

    const transfer = await client
      .open(
        WalletContractV4.create({ workchain: 0, publicKey: keyPair.publicKey }),
      )
      .createTransfer({
        seqno,
        secretKey: keyPair.secretKey,
        messages: [internalMessage],
        sendMode: SendMode.PAY_GAS_SEPARATELY,
      });

    // Send the transfer to the contract
    await client.sendExternalMessage(wallet, transfer);
  };

  updateClickCount = async ({ affiliateAddress, cpc }: any) => {
    try {
      const gasFees = toNano('0.005');
      const cpcInNano = toNano(cpc.toString());
      await this.sendWithdrawRequest(affiliateAddress, gasFees, cpcInNano);
    } catch (error) {
      console.log('---error----updateClickCount------->', error);
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
      console.log('error--->', err);
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
