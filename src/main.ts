import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const logger = new Logger('main');
  const configService = new ConfigService();

  const [
    BROKER_USER,
    BROKER_PASSWORD,
    BROKER_IP,
    BROKER_VIRTUAL_HOST,
    BROKER_PORT,
  ] = [
    configService.get<string>('BROKER_USER'),
    configService.get<string>('BROKER_PASSWORD'),
    configService.get<string>('BROKER_IP'),
    configService.get<string>('BROKER_VIRTUAL_HOST'),
    configService.get<number>('BROKER_PORT'),
  ];

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [
          `amqp://${BROKER_USER}:${BROKER_PASSWORD}@${BROKER_IP}:${BROKER_PORT}/${BROKER_VIRTUAL_HOST}`,
        ],
        noAck: false,
        queue: 'rankings-backend',
      },
    },
  );

  app.listen();
}
bootstrap();
