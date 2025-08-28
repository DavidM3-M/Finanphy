import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Income } from './income.entity';
import { Expense } from './expense.entity';
import { Investment } from './investment.entity';  //  Nueva entidad
import { IncomesController } from './incomes.controller';
import { ExpensesController } from './expenses.controller';
import { InvestmentsController } from './investments.controller'; //  Nuevo controller
import { IncomesService } from './incomes.service';
import { ExpensesService } from './expenses.service';
import { InvestmentsService } from './investments.service'; //  Nuevo service

@Module({
  imports: [TypeOrmModule.forFeature([Income, Expense, Investment])], 
  controllers: [IncomesController, ExpensesController, InvestmentsController],
  providers: [IncomesService, ExpensesService, InvestmentsService],
})
export class FinanceModule {}
