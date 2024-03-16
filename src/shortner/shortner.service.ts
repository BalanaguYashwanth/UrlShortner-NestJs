import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as moment from 'moment';
import { Model } from 'mongoose';
import { CreateShortUrlDto } from './shortner.dto';
import { ShortUrlProps } from './shortner.model';

@Injectable()
export class ShortnerService {
  private readonly DOMAIN = 'http://localhost:3000';
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

  checkUrlExpiration = (expirationTime) => {
    const currentTime = moment().unix();
    if (expirationTime < currentTime) {
      return true;
    }
  };

  noPageFound = () => {
    return `${this.DOMAIN}/404`;
  };

  createShortURL = async (
    createShortUrlDto: CreateShortUrlDto,
  ): Promise<string> => {
    const { expirationTime = null, url } = createShortUrlDto;
    const shortAlias = this.generateRandomAlphaNumeric();
    //Todo - Move to .env
    const shortUrl = `${this.DOMAIN}/${shortAlias}`;
    const newShortUrl = new this.shortUrlModel({
      expirationTime,
      shortAlias,
      shortUrl,
      url,
      visitHistory: [],
    });
    await newShortUrl.save();
    return shortUrl;
  };

  getShortURL = async (id: string): Promise<string> => {
    const response = await this.shortUrlModel.findOne({ shortAlias: id });
    if (response) {
      const { expirationTime, url } = response as any;
      if (this.checkUrlExpiration(expirationTime)) {
        return this.noPageFound();
      }
      return url;
    } else {
      return this.noPageFound();
    }
  };
}
