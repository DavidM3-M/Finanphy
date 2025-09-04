// src/finance/expenses.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense } from '../entities/expense.entity';
import { CreateExpenseDto } from '../dto/create-expense.dto';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private readonly expensesRepo: Repository<Expense>,
  ) {}

  async findAll() {
    return this.expensesRepo.find();
  }

  async findOne(id: number) {
    const expense = await this.expensesRepo.findOne({ where: { id } });
    if (!expense) throw new NotFoundException('Gasto no encontrado');
    return expense;
  }

  async create(dto: CreateExpenseDto) {
    const expense = this.expensesRepo.create(dto);
    return this.expensesRepo.save(expense);
  }
}
