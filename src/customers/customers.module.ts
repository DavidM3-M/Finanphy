import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { Customer } from './entities/customer.entity';
import { Company } from 'src/companies/entities/company.entity';
import { CustomerPayment } from './entities/customer-payment.entity';
import { ClientOrder } from 'src/client_orders/entities/client-order.entity';
import { CustomerPaymentsService } from './customer-payments.service';

@Module({
  imports: [TypeOrmModule.forFeature([Customer, Company, CustomerPayment, ClientOrder])],
  controllers: [CustomersController],
  providers: [CustomersService, CustomerPaymentsService],
  exports: [CustomersService, CustomerPaymentsService],
})
export class CustomersModule {}
