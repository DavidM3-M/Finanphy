// src/finance/incomes.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Income } from './income.entity';
import { CreateIncomeDto } from './dto/create-income.dto';

@Injectable()
export class IncomesService {
  constructor(
    @InjectRepository(Income)
    private readonly incomesRepo: Repository<Income>,
  ) {}

  async findAll() {
    return this.incomesRepo.find();
  }

  async findOne(id: number) {
    const income = await this.incomesRepo.findOne({ where: { id } });
    if (!income) throw new NotFoundException('Ingreso no encontrado');
    return income;
  }

  async create(dto: CreateIncomeDto) {
    const income = this.incomesRepo.create(dto);
    return this.incomesRepo.save(income);
  }
}
