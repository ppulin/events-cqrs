export interface ISnsNotification {
  Type: string;
  MessageId: string;
  TopicArn: string;
  Message: string; // JSON-строка, которую можно дополнительно распарсить
  Timestamp: string; // ISO строка
  UnsubscribeURL: string;
  MessageAttributes: {
    eventType: {
      Type: string;
      Value: string;
    };
    sourceService: {
      Type: string;
      Value: string;
    };
  };
  SignatureVersion: string;
  Signature: string;
  SigningCertURL: string;
}

export interface IEventPublisher {
  publishCommand(command: any): Promise<void>;
}

export interface IEventConsumer {
  start(): void;
  stop(): void;
}
