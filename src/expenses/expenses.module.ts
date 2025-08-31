// src/expenses/expenses.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpensesService } from './services/expenses.service';
import ExpensesController from './controllers/expenses.controller'; // ← Import default
import { Expense } from './entities/expense.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Expense]),
  ],
  providers: [ExpensesService],
  controllers: [ExpensesController], // ← Usar el import correcto
  exports: [ExpensesService],
})
export class ExpensesModule {}