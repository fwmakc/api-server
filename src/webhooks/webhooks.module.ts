import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventDeliveryGuard } from 'api-server-toolkit/guard';

import { AccountEntity } from '../account/account.entity';
import { ProcessedEventEntity } from './processed-event.entity';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { SubscriberService } from './subscriber.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([AccountEntity, ProcessedEventEntity]),
  ],
  controllers: [WebhooksController],
  providers: [WebhooksService, SubscriberService, EventDeliveryGuard],
})
export class WebhooksModule {}
