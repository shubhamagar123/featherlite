import { IBrokerAdapter } from './broker-adapter.interface';
import { InMemoryBroker } from './in-memory-broker';
import { KafkaBroker } from './kafka-broker';
import { RabbitMQBroker } from './rabbitmq-broker';
import { EventBridgeBroker } from './eventbridge-broker';
import { EventRetryPolicy } from '../dto/event.dto';
import { createLogger } from '@utils/logger';

export type BrokerType = 'inmemory' | 'kafka' | 'rabbitmq' | 'eventbridge';

export interface BrokerFactoryConfig {
  type: BrokerType;
  retryPolicy?: EventRetryPolicy;
  kafka?: {
    brokers: string[];
    clientId: string;
    consumerGroupId?: string;
  };
  rabbitmq?: {
    url: string;
    exchangeName?: string;
    queuePrefix?: string;
  };
  eventbridge?: {
    region: string;
    eventBusName?: string;
    source?: string;
  };
}

const logger = createLogger('BrokerFactory');

/**
 * Factory for creating broker adapter instances.
 * Supports pluggable brokers: InMemory (default), Kafka, RabbitMQ, EventBridge.
 */
export class BrokerFactory {
  static createBroker(config: BrokerFactoryConfig): IBrokerAdapter {
    const brokerType = config.type.toLowerCase();

    logger.info({ brokerType }, 'Creating broker adapter');

    switch (brokerType) {
      case 'kafka':
        if (!config.kafka) {
          throw new Error('Kafka configuration required for Kafka broker');
        }
        return new KafkaBroker({
          brokers: config.kafka.brokers,
          clientId: config.kafka.clientId,
          retryPolicy: config.retryPolicy,
          consumerGroupId: config.kafka.consumerGroupId,
        });

      case 'rabbitmq':
        if (!config.rabbitmq) {
          throw new Error('RabbitMQ configuration required for RabbitMQ broker');
        }
        return new RabbitMQBroker({
          url: config.rabbitmq.url,
          exchangeName: config.rabbitmq.exchangeName,
          queuePrefix: config.rabbitmq.queuePrefix,
          retryPolicy: config.retryPolicy,
        });

      case 'eventbridge':
        if (!config.eventbridge) {
          throw new Error('EventBridge configuration required for EventBridge broker');
        }
        return new EventBridgeBroker({
          region: config.eventbridge.region,
          eventBusName: config.eventbridge.eventBusName,
          source: config.eventbridge.source,
          retryPolicy: config.retryPolicy,
        });

      case 'inmemory':
      default:
        return new InMemoryBroker(config.retryPolicy);
    }
  }

  static createFromEnvironment(retryPolicy?: EventRetryPolicy): IBrokerAdapter {
    const brokerType = (process.env.EVENT_BROKER_TYPE || 'inmemory').toLowerCase() as BrokerType;

    const config: BrokerFactoryConfig = {
      type: brokerType,
      retryPolicy,
    };

    if (brokerType === 'kafka') {
      const brokers = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');
      const clientId = process.env.KAFKA_CLIENT_ID || 'featherlight-backend';
      const consumerGroupId = process.env.KAFKA_CONSUMER_GROUP || 'featherlight-events';

      config.kafka = {
        brokers,
        clientId,
        consumerGroupId,
      };
    }

    if (brokerType === 'rabbitmq') {
      const url = process.env.RABBITMQ_URL || 'amqp://localhost';
      const exchangeName = process.env.RABBITMQ_EXCHANGE || 'featherlight.events';
      const queuePrefix = process.env.RABBITMQ_QUEUE_PREFIX || 'featherlight.queue';

      config.rabbitmq = {
        url,
        exchangeName,
        queuePrefix,
      };
    }

    if (brokerType === 'eventbridge') {
      const region = process.env.AWS_REGION || 'us-east-1';
      const eventBusName = process.env.EVENTBRIDGE_BUS || 'default';
      const source = process.env.EVENTBRIDGE_SOURCE || 'featherlight.backend';

      config.eventbridge = {
        region,
        eventBusName,
        source,
      };
    }

    return this.createBroker(config);
  }
}
