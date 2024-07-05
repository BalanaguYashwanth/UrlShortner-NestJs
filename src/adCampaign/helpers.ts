import { getFullnodeUrl, SuiClient } from '@mysten/sui.js/client';

const getMaxBalanceObjectAddress = (balanceArr, budget) => {
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

export const splitCoin = async ({ budget, receiverAddress }) => {
  try {
    const suiClient = new SuiClient({ url: getFullnodeUrl('mainnet') });
    const walletBalanceArr = await suiClient.getCoins({
      owner: receiverAddress,
    });

    const address = getMaxBalanceObjectAddress(walletBalanceArr?.data, budget);
    return address;
  } catch (err) {
    throw new Error(err);
  }
};

export const saveAffiliateIntoDB = async ({
  affiliateModel,
  affiliateDto,
  profileTxAddress,
  shortnerService,
}) => {
  const { campaignUrl, originalUrl } = affiliateDto;

  //saving affiliate data
  const affiliateResponse = (await affiliateModel.create({
    ...affiliateDto,
    urlAlias: campaignUrl.split('/')[3],
    profileAddress: profileTxAddress,
  })) as any;

  const createShortUrlDto = {
    url: originalUrl,
    shortUrl: campaignUrl,
  };

  //saving affiliate campaign url
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
