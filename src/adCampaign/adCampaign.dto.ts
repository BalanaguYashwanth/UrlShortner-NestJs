export class CampaignDto {
  campaignName: string;
  companyName: string;
  description: string;
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
  originalUrl: string;
  campaignUrl: string;
  campaignInfoAddress: string;
  walletAddress: string;
  profileAddress: string;
}

export class SupportersDto {
 campaignConfig: string;
 campaignInfoAddress: string;
 message: string;
 coins: string;
 maxCoinValueAddress: string;
}