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

export interface ShortUrlProps {
  expirationTime: number;
  shortAlias: string;
  shortUrl: string;
  url: string;
  visitHistory: [];
}
