// src/orders/orders.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from './orders.service'
import { OrdersController } from './controllers/orders.controller';
import { Order } from './entity/order.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([Order]),
  ],
  providers: [OrdersService],
  controllers: [OrdersController],
  exports: [OrdersService],
})
export class OrdersModule {}
