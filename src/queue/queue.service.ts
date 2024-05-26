import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
  SendMessageCommand,
} from '@aws-sdk/client-sqs';
import { SQSClient } from '@aws-sdk/client-sqs';
import { Consumer } from 'sqs-consumer';
import { Inject, Injectable, OnModuleInit, forwardRef } from '@nestjs/common';
import { ShortnerService } from 'src/shortner/shortner.service';

@Injectable()
export class QueueService implements OnModuleInit {
  private consumer;
  private sqsClient;
  private awsConfig;
  private messageIdSet = new Set();
  constructor(
    @Inject(forwardRef(() => ShortnerService))
    private shortnerService: ShortnerService,
  ) {
    this.awsConfig = {
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_KEY_ID,
      },
    };
    console.log('log--->', this.awsConfig);
    this.sqsClient = new SQSClient(this.awsConfig);
  }

  pushMessageToQueue = async (body: any) => {
    try {
      const command = new SendMessageCommand({
        MessageBody: body,
        QueueUrl: process.env.QUEUE_URL,
      });
      await this.sqsClient.send(command);
    } catch (error) {
      console.log('error--->', error);
    }
  };

  deleteMessageFromQueue = async (ReceiptHandle) => {
    try {
      const deleteResponse = await this.sqsClient.send(
        new DeleteMessageCommand({
          QueueUrl: process.env.QUEUE_URL,
          ReceiptHandle: ReceiptHandle,
        }),
      );
      console.log('delete response--->', deleteResponse);
    } catch (err) {
      console.log(err);
    }
  };

  recieveMessagesFromQueue = async () => {
    try {
      const receiveRef = new ReceiveMessageCommand({
        MaxNumberOfMessages: 10,
        QueueUrl: process.env.QUEUE_URL,
        WaitTimeSeconds: 5,
        MessageAttributeNames: ['All'],
        VisibilityTimeout: 10,
      });
      const receiveResponse = await this.sqsClient.send(receiveRef);
      console.log(receiveResponse);
      const receiptHandle = receiveResponse.Messages[0].ReceiptHandle;
      await this.deleteMessageFromQueue(receiptHandle);
      console.log('deleted successfully');
    } catch (err) {
      console.log('err--->', err);
    }
  };

  async onModuleInit() {
    this.consumer = Consumer.create({
      queueUrl: process.env.QUEUE_URL,
      sqs: this.sqsClient,
      handleMessage: this.handleMessage.bind(this),
      messageAttributeNames: ['All'],
    });
    this.consumer.on('error', this.handleError.bind(this));
    this.consumer.on('processing_error', this.handleProcessingError.bind(this));
    this.consumer.start();
  }

  async handleMessage(message) {
    const { Body, MessageId } = message;
    if (!this.messageIdSet.has(MessageId)) {
      const { hasShortUrlDetails, ip } = JSON.parse(Body);
      this.shortnerService.recordAndUpdateShortURLMetrics({
        hasShortUrlDetails,
        ip,
      });
      this.messageIdSet.add(MessageId);
    }
  }

  async handleError(err) {
    console.error('SQS Consumer Error:', err.message);
  }

  async handleProcessingError(err) {
    console.error('SQS Consumer Processing Error:', err.message);
  }
}
