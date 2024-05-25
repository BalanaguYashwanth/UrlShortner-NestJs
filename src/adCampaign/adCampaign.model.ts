import mongoose from 'mongoose';

export const AffiliateSchema = new mongoose.Schema(
  {
    expirationTime: {
      type: String,
    },
    originalUrl: {
      type: String,
      required: [true, 'Original URL is required'],
    },
    campaignUrl: {
      type: String,
      required: [true, 'Campaign URL is required'],
    },
    campaignInfoAddress: {
      type: String,
      required: [true, 'campaign object address is required'],
    },
    walletAddress: {
      type: String,
      required: [true, 'Wallet address is required'],
    },
    earnings: {
      type: Number,
      default: 0,
    },
    profileAddress: {
      type: String,
    },
    campaignProfileAddress: {
      type: String,
    },
    urlAlias: {
      type: String,
    },
    validClicks: {
      type: Number,
      default: 0,
    },
    invalidClicks: {
      type: Number,
      default: 0,
    },
    totalIPAddress: {
      type: Array,
    },
  },
  {
    timestamps: true,
  },
);

export const CampaignSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: [true, 'Company Name is required'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
    },
    originalUrl: {
      type: String,
      required: [true, 'Original URL is required'],
    },
    coinObjectAddress: {
      type: String,
      required: [true, 'Coin Object Address is required'],
    },
    cpc: {
      type: String,
      required: [true, 'CPC is required'],
    },
    campaignBudget: {
      type: String,
      required: [true, 'Campaign Budgetis required'],
    },
    startDate: {
      type: String,
      required: [true, 'Start Date is required'],
    },
    endDate: {
      type: String,
      required: [true, 'End Date is required'],
    },
    campaignWalletAddress: {
      type: String,
      required: [true, 'Campaign Wallet Address is required'],
    },
    campaignInfoAddress: {
      type: String,
      required: [true, 'Campaign Info Address is required'],
    },
    packageAddress: {
      type: String,
      required: [true, 'Package Address is required'],
    },
    campaignConfig: {
      type: String,
      required: [true, 'Campaign Config Address is required'],
    },
    status: {
      type: Number,
      default: 2,
    },
  },
  {
    timestamps: true,
  },
);
