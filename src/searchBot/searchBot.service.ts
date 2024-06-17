import { Injectable } from '@nestjs/common';
import { KendraClient, QueryCommand } from '@aws-sdk/client-kendra';

@Injectable()
export class SearchBotService {
  private readonly kendraClient: KendraClient;
  private readonly indexId: string = process.env.AWS_INDEX_ID;

  constructor() {
    this.kendraClient = new KendraClient({
      region: process.env.AWS_KENDRA_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  async searchBot(queryText: string): Promise<string[]> {
    const params = {
      IndexId: this.indexId,
      QueryText: queryText,
    };

    const command = new QueryCommand(params);

    try {
      const data = await this.kendraClient.send(command);
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
