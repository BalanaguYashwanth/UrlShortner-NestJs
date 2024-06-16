import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { getHttpEndpoint } from '@orbs-network/ton-access';
import { getFullnodeUrl, SuiClient } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import {
  address,
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
    senderAddress: string,
    affiliateAddress: string,
    value: bigint,
    amount: bigint,
  ) => {
    const client = new TonClient({
      endpoint: await getHttpEndpoint({ network: 'testnet' }),
    });

    const mnemonics = process.env.TON_OWNER_MNEMONIC_KEY; // if it failes and check using fn of generate new mnemonic key
    const keyPair = await mnemonicToPrivateKey([mnemonics]);

    const workchain = 0;
    const wallet = WalletContractV4.create({
      workchain,
      publicKey: keyPair.publicKey,
    });

    // Get the contract
    const contract = client.open(wallet);

    const balance: bigint = await contract.getBalance();

    console.log('balance----->', balance);

    // Get the current sequence number
    const seqno: number = await contract.getSeqno();

    // Create the message body
    const msgBody = beginCell()
      .storeUint(3, 32) // Operation ID
      .storeCoins(toNano(0.01)) // Amount to withdraw
      .storeAddress(address(affiliateAddress)) // Affiliate address
      .endCell();

    // Create the transfer
    const transfer = await contract.createTransfer({
      seqno,
      secretKey: keyPair.secretKey,
      messages: [
        internal({
          value: value,
          to: senderAddress,
          body: msgBody,
        }),
      ],
      sendMode: SendMode.PAY_GAS_SEPARATELY,
    });

    // Send the transfer
    await contract.send(transfer);
  };

  updateClickCount = async ({ affiliateAddress }: any) => {
    try {
      const senderAddress = '0QDjKdn0N-_Whu1aMCYzOrpzLCupkKhBo0LiZ7NAbLZ8fT_6';
      const value = toNano('0.05');
      const amount = toNano('0.5');
      await this.sendWithdrawRequest(
        senderAddress,
        affiliateAddress,
        value,
        amount,
      );
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
