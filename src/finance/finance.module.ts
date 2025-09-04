import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Income } from './entities/income.entity';
import { Expense } from './entities/expense.entity';
import { Investment } from './entities/investment.entity'; // Nueva entidad
import { IncomesController } from './controllers/incomes.controller';
import { ExpensesController } from './controllers/expenses.controller';
import { InvestmentsController } from './controllers/investments.controller'; // Nuevo controller
import { IncomesService } from './services/incomes.service';
import { ExpensesService } from './services/expenses.service';
import { InvestmentsService } from './services/investments.service'; // Nuevo service

@Module({
  imports: [TypeOrmModule.forFeature([Income, Expense, Investment])],
  controllers: [IncomesController, ExpensesController, InvestmentsController],
  providers: [IncomesService, ExpensesService, InvestmentsService],
})
export class FinanceModule {}