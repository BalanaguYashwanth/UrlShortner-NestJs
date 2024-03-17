import mongoose from 'mongoose';

export const ShortUrlSchema = new mongoose.Schema(
  {
    expirationTime: {
      type: Number,
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
    visitHistory: {
      type: Array,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

//Todo - Move to seperate module
export const AnalyticsSchema = new mongoose.Schema(
  {
    browserType: Object,
    count: {
      type: Number,
      min: 0,
    },
    deviceType: Object,
    shortUrl: {
      type: String,
      unique: true,
      required: true,
    },
    osType: Object,
  },
  {
    timestamps: true,
  },
);

export interface ShortUrlProps {
  expirationTime: number;
  shortAlias: string;
  shortUrl: string;
  url: string;
  visitHistory: [];
}

export interface AnalyticsProps {
  count: number;
  deviceTypeCount: DeviceType;
}

export interface DeviceType {
  mobile: number;
  tablet: number;
  desktop: number;
}
