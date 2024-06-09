import { Injectable } from '@nestjs/common';
import * as AWS from 'aws-sdk';

@Injectable()
export class SearchBotService {
  private readonly kendra: AWS.Kendra;
  private readonly indexId: string = process.env.AWS_INDEX_ID; 

  constructor() {
    AWS.config.update({ region: process.env.AWS_KENDRA_REGION,
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey:process.env.AWS_SECRET_ACCESS_KEY
     }); 
    this.kendra = new AWS.Kendra({ apiVersion: '2019-02-03' });
  }

  async searchBot(queryText: string): Promise<string[]> {
    const params = {
      IndexId: this.indexId,
      QueryText: queryText,
    };

    try {
      const data = await this.kendra.query(params).promise();
      const textResults = data.ResultItems
      .filter(result => result.Type === 'ANSWER' && result.Format === 'TEXT')
      .map(result => result.DocumentExcerpt.Text);
      return textResults;
    } catch (error) {
      console.error('Error querying Kendra:', error);
      throw new Error('Error querying Kendra');
    }
  }
}
