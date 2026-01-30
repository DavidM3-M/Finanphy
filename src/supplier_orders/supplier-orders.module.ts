import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupplierOrdersController } from './supplier-orders.controller';
import { SupplierOrdersService } from './supplier-orders.service';
import { SupplierOrder } from './entities/supplier-order.entity';
import { SupplierOrderItem } from './entities/supplier-order-item.entity';
import { Supplier } from 'src/suppliers/entities/supplier.entity';
import { Company } from 'src/companies/entities/company.entity';
import { Product } from 'src/products/entities/product.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SupplierOrder,
      SupplierOrderItem,
      Supplier,
      Company,
      Product,
    ]),
  ],
  controllers: [SupplierOrdersController],
  providers: [SupplierOrdersService],
})
export class SupplierOrdersModule {}
