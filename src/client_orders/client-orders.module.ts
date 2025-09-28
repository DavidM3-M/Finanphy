import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientOrdersController } from './client-orders.controller';
import { ClientOrdersService } from './client-orders.service';
import { ClientOrder } from './entities/client-order.entity';
import { ClientOrderItem } from './entities/client-order-item.entity';
import { Product } from '../products/entities/product.entity';
import { UserEntity } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ClientOrder,
      ClientOrderItem,
      Product,
      UserEntity,
    ]),
  ],
  controllers: [ClientOrdersController],
  providers: [ClientOrdersService],
})
export class ClientOrdersModule {}