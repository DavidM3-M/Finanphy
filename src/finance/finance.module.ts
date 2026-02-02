import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Income } from './entities/income.entity';
import { Expense } from './entities/expense.entity';
import { Investment } from './entities/investment.entity';
import { Company } from 'src/companies/entities/company.entity'; // 👈 Importa la entidad Company
import { Customer } from 'src/customers/entities/customer.entity';

import { IncomesController } from './controllers/incomes.controller';
import { ExpensesController } from './controllers/expenses.controller';
import { InvestmentsController } from './controllers/investments.controller';

import { IncomesService } from './services/incomes.service';
import { ExpensesService } from './services/expenses.service';
import { InvestmentsService } from './services/investments.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Income, Expense, Investment, Company, Customer]),
  ],
  controllers: [IncomesController, ExpensesController, InvestmentsController],
  providers: [IncomesService, ExpensesService, InvestmentsService],
})
export class FinanceModule {}
