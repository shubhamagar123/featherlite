import { BrokerFactory } from '../broker-factory';
import { InMemoryBroker } from '../in-memory-broker';
import { KafkaBroker } from '../kafka-broker';
import { RabbitMQBroker } from '../rabbitmq-broker';
import { EventBridgeBroker } from '../eventbridge-broker';

describe('BrokerFactory', () => {
  describe('createBroker', () => {
    it('creates InMemoryBroker by default', () => {
      const broker = BrokerFactory.createBroker({ type: 'inmemory' });
      expect(broker).toBeInstanceOf(InMemoryBroker);
      expect(broker.getBrokerType()).toBe('InMemory');
    });

    it('creates KafkaBroker when configured', () => {
      const broker = BrokerFactory.createBroker({
        type: 'kafka',
        kafka: {
          brokers: ['localhost:9092'],
          clientId: 'test-client',
        },
      });

      expect(broker).toBeInstanceOf(KafkaBroker);
      expect(broker.getBrokerType()).toBe('Kafka');
    });

    it('creates RabbitMQBroker when configured', () => {
      const broker = BrokerFactory.createBroker({
        type: 'rabbitmq',
        rabbitmq: {
          url: 'amqp://localhost',
        },
      });

      expect(broker).toBeInstanceOf(RabbitMQBroker);
      expect(broker.getBrokerType()).toBe('RabbitMQ');
    });

    it('creates EventBridgeBroker when configured', () => {
      const broker = BrokerFactory.createBroker({
        type: 'eventbridge',
        eventbridge: {
          region: 'us-east-1',
        },
      });

      expect(broker).toBeInstanceOf(EventBridgeBroker);
      expect(broker.getBrokerType()).toBe('EventBridge');
    });

    it('throws error if Kafka config missing', () => {
      expect(() => {
        BrokerFactory.createBroker({ type: 'kafka' });
      }).toThrow('Kafka configuration required');
    });

    it('throws error if RabbitMQ config missing', () => {
      expect(() => {
        BrokerFactory.createBroker({ type: 'rabbitmq' });
      }).toThrow('RabbitMQ configuration required');
    });

    it('throws error if EventBridge config missing', () => {
      expect(() => {
        BrokerFactory.createBroker({ type: 'eventbridge' });
      }).toThrow('EventBridge configuration required');
    });

    it('creates broker with retry policy', () => {
      const retryPolicy = {
        maxRetries: 5,
        baseDelayMs: 1000,
      };

      const broker = BrokerFactory.createBroker({
        type: 'inmemory',
        retryPolicy,
      });

      expect(broker).toBeInstanceOf(InMemoryBroker);
    });
  });

  describe('createFromEnvironment', () => {
    const originalEnv = { ...process.env };

    afterEach(() => {
      process.env = { ...originalEnv };
    });

    it('creates InMemoryBroker when no broker type specified', () => {
      delete process.env.EVENT_BROKER_TYPE;
      const broker = BrokerFactory.createFromEnvironment();
      expect(broker).toBeInstanceOf(InMemoryBroker);
    });

    it('reads Kafka config from environment', () => {
      process.env.EVENT_BROKER_TYPE = 'kafka';
      process.env.KAFKA_BROKERS = 'broker1:9092,broker2:9092';
      process.env.KAFKA_CLIENT_ID = 'my-client';

      const broker = BrokerFactory.createFromEnvironment();
      expect(broker).toBeInstanceOf(KafkaBroker);
    });

    it('reads RabbitMQ config from environment', () => {
      process.env.EVENT_BROKER_TYPE = 'rabbitmq';
      process.env.RABBITMQ_URL = 'amqp://rabbitmq.example.com';
      process.env.RABBITMQ_EXCHANGE = 'my-exchange';

      const broker = BrokerFactory.createFromEnvironment();
      expect(broker).toBeInstanceOf(RabbitMQBroker);
    });

    it('reads EventBridge config from environment', () => {
      process.env.EVENT_BROKER_TYPE = 'eventbridge';
      process.env.AWS_REGION = 'eu-west-1';
      process.env.EVENTBRIDGE_BUS = 'my-bus';

      const broker = BrokerFactory.createFromEnvironment();
      expect(broker).toBeInstanceOf(EventBridgeBroker);
    });
  });
});
