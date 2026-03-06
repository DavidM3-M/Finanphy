import { Module } from '@nestjs/common';
import { DebtsController } from './debts.controller';
import { DebtsService } from './debts.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Debt } from './entities/debt.entity';
import { Supplier } from 'src/finance/suppliers/entities/suppliers.entity';


@Module({
  imports: [
  TypeOrmModule.forFeature([Debt, Supplier]),
],
  controllers: [DebtsController],
  providers: [DebtsService]
})
export class DebtsModule {}
