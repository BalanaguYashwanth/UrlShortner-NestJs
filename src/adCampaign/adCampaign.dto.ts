export class CampaignDto {
  campaignName: string;
  companyName: string;
  description: string;
  category: string;
  originalUrl: string;
  total_clicks: number;
  cpc: string;
  campaignBudget: string;
  coinObjectAddress: string;
  startDate: string;
  endDate: string;
  campaignWalletAddress: string;
  campaignInfoAddress: string;
  companyXProfile: string;
  campaignvideolink: string;
  packageAddress: string;
  status: string;
  likes: [string];
  dislikes: [string];
}

export class AffiliateDto {
  affiliateUID: string;
  campaignUID: string;
  originalUrl: string;
  campaignUrl: string;
  cpc: number;
  campaignInfoAddress: string;
  walletAddress: string;
  profileAddress: string;
  expirationTime: string;
}

export class SupportersDto {
  campaignConfig: string;
  campaignInfoAddress: string;
  message: string;
  coins: string;
  maxCoinValueAddress: string;
  walletAddress: string;
  transactionDigest: string;
}

export class UpdateLikeDto {
  campaignId: string;
  userId: string;
  type: string;
}
