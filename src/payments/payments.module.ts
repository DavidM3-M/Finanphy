import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';
import { Debt } from 'src/finance/debts/entities/debt.entity';
import { User } from '../users/entity/users.entity';

@Module({
  imports: [
  TypeOrmModule.forFeature([Payment, Debt, User]),
],
  controllers: [PaymentsController],
  providers: [PaymentsService]
})
export class PaymentsModule {}
