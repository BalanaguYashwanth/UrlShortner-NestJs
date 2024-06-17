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
import { getHttpEndpoint } from '@orbs-network/ton-access';

export class HandleAffiliateSUIOperations {
  private suiClient;
  private keyPair;
  constructor() {
    // const RPC_ENV = process.env.RPC_ENV as any;
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
      const txb = new TransactionBlock();
      const [splittedCoin] = txb.splitCoins(txb.gas, [budget]);
      txb.transferObjects([splittedCoin, txb.gas], receiverAddress);
      await this.suiClient.signAndExecuteTransactionBlock({
        signer: this.keyPair,
        transactionBlock: txb,
      });
      await new Promise((resolve) => setTimeout(resolve, 2000));
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

const generateUniqueNumericId = () => {
  const timestamp = Date.now() % 100000; // Use last 5 digits of timestamp
  const randomNum = Math.floor(Math.random() * 100000); // Random number between 0 and 99999
  const uniqueId = (timestamp * 100000 + randomNum) % 2147483647; // Ensure it fits 32-bit range
  return uniqueId;
};

const registerAffiliateProfile = async ({
  walletAddress,
  campaignId,
  campaignWalletAddress,
  affiliateId,
  campaignUrl,
  originalUrl,
}: any) => {
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

  const campaignUrlCell = beginCell()
    .storeBuffer(Buffer.from(campaignUrl, 'utf-8'))
    .endCell();

  const originalUrlCell = beginCell()
    .storeBuffer(Buffer.from(originalUrl, 'utf-8'))
    .endCell();

  const msgBody = beginCell()
    .storeUint(2, 32) // Operation ID
    .storeAddress(Address.parse(walletAddress))
    .storeUint(campaignId, 32)
    .storeAddress(Address.parse(campaignWalletAddress))
    .storeRef(campaignUrlCell)
    .storeRef(originalUrlCell)
    .storeUint(0, 32)
    .storeUint(0, 32)
    .storeUint(affiliateId, 64)
    .endCell();

  // Create the internal message to send to the contract
  const internalMessage = internal({
    value: toNano('0.05'),
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

export const saveAffiliate = async ({
  affiliateModel,
  affiliateDto,
  shortnerService,
  walletAddress,
  campaignId,
}) => {
  const { campaignUrl, originalUrl, campaignWalletAddress } = affiliateDto;
  const affiliateDetails = await affiliateModel.findOne({
    walletAddress,
  });
  const affiliateUinqueId =
    affiliateDetails?.affiliateId || generateUniqueNumericId();

  registerAffiliateProfile({
    walletAddress,
    campaignId,
    affiliateId: affiliateUinqueId,
    campaignWalletAddress,
    campaignUrl,
    originalUrl,
  });

  const affiliateResponse = (await affiliateModel.create({
    affiliateId: affiliateUinqueId,
    campaignId,
    ...affiliateDto,
    urlAlias: campaignUrl.split('/')[3],
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
  campaignId,
  walletAddress,
}) => {
  const details = await affiliateModel.findOne({
    campaignId,
    walletAddress,
  });
  return details;
};
