import mongoose from 'mongoose';

export const UrlHistorySchema = new mongoose.Schema(
  {
    browserType: {
      type: Object,
    },
    clicks: {
      type: Number,
      min: 0,
    },
    deviceType: {
      type: Object,
    },
    expirationTime: {
      type: Number,
    },
    osType: {
      type: Object,
    },
    refType: {
      type: Object,
    },
    shortAlias: {
      type: String,
      unique: true,
      required: true,
    },
    shortUrl: {
      type: String,
      unique: true,
      required: true,
    },
    url: {
      type: String,
      required: [true, 'Url is required'],
    },
  },
  {
    timestamps: true,
  },
);

export const TimeAnalyticsSchema = new mongoose.Schema({
  shortUrlId: { type: mongoose.Schema.Types.ObjectId, ref: 'UrlHistory' },
  timezone: { type: String, default: 'Asia/Kolkata' },
  clickedAt: { type: Date, default: Date.now },
});

export interface UrlHistoryProps {
  browserType: object;
  clicks: object;
  deviceType: object;
  expirationTime: number;
  osType: object;
  refType: object;
  shortAlias: string;
  shortUrl: string;
  url: string;
}

export interface TimeAnalyticsProps {
  clickedAt: Date;
}
