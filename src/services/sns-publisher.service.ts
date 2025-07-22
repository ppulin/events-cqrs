import { Injectable } from '@nestjs/common';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

@Injectable()
export class SnsPublisherService {
  private readonly client = new SNSClient({ region: 'your-region' });
  private readonly topicArn = 'arn:aws:sns:your-region:account-id:YourTopic';

  async publishCommand(command: any): Promise<void> {
    const message = JSON.stringify({
      type: command.constructor.name,
      data: command.data,
    });

    const publishCommand = new PublishCommand({
      TopicArn: this.topicArn,
      Message: message,
      MessageAttributes: {
        type: {
          DataType: 'String',
          StringValue: command.constructor.name,
        },
      },
    });

    await this.client.send(publishCommand);
  }
}
