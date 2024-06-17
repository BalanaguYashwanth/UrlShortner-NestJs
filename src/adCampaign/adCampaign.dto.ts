export class CampaignDto {
  description: string;
  campaignName: string;
  companyName: string;
  campaignId: number;
  category: string;
  original_url: string;
  campaign_url: string;
  total_clicks: number;
  cpc: string;
  budget: string;
  coinObjectAddress: string;
  startDate: string;
  endDate: string;
  campaignWalletAddress: string;
  campaignInfoAddress: string;
  packageAddress: string;
  status: string;
}

export class AffiliateDto {
  affiliateId: number;
  originalUrl: string;
  campaignUrl: string;
  cpc: number;
  walletAddress: string;
  campaignId: number;
  campaignWalletAddress: string;
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
