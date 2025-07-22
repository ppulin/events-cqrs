export interface AwsConfig {
  region: string;
  endpoint?: string;
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
  };
}

export interface SnsConfig {
  topicArn: string;
}

export interface SqsConfig {
  queueUrl: string;
}

export interface EventsCqrsConfig {
  aws: AwsConfig;
  sns: SnsConfig;
  sqs: SqsConfig;
  serviceName: string;
}

export const EVENTS_CQRS_CONFIG = 'EVENTS_CQRS_CONFIG';