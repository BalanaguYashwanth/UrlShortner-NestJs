import { Injectable } from '@nestjs/common';
import { CreateShortUrlDto } from './shortner.dto';
import { ShortUrlProps } from './shortner.model';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class ShortnerService {
  constructor(
    @InjectModel('ShortUrlModel')
    private readonly shortUrlModel: Model<ShortUrlProps>,
  ) {}

  generateRandomAlphaNumeric = () => {
    const characters = 'abcdefghijklmnopqrstuvwxyz';
    const charactersLimit = 4;
    let randomFourCharacters = '';

    for (let i = 0; i < charactersLimit; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      randomFourCharacters += characters.charAt(randomIndex);
    }

    return randomFourCharacters;
  };

  createShortURL = async (
    createShortUrlDto: CreateShortUrlDto,
  ): Promise<string> => {
    const { url } = createShortUrlDto;
    const shortAlias = this.generateRandomAlphaNumeric();
    //Todo - Move to .env
    const domain = 'http://localhost:3000';
    const shortUrl = `${domain}/${shortAlias}`;
    const newShortUrl = new this.shortUrlModel({
      url,
      shortUrl,
      shortAlias,
      visitHistory: [],
    });
    await newShortUrl.save();
    return shortUrl;
  };

  getShortURL = async (id: string): Promise<string> => {
    const response = await this.shortUrlModel.findOne({ shortAlias: id });
    const { url } = response as any;
    return url;
  };
}
