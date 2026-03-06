// src/finance/incomes.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Income } from './entities/income.entity';
import { CreateIncomeDto } from './dto/create-income.dto';
import { UpdateIncomeDto } from './dto/update-income.dto';


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
    const income = this.incomesRepo.create({
      amount : dto.amount,
      category : dto.category,
      invoiceNumber : dto.invoiceNumber,
      entryDate : dto.entryDate ? new Date(dto.entryDate) : undefined,
      dueDate : dto.dueDate ? new Date(dto.dueDate) : undefined,
    });
    return this.incomesRepo.save(income)
  
  }

  async update(id: number, dto: UpdateIncomeDto) {
    const income = await this.findOne(id); // valida que exista

    //Solo se actualizan campos permitidos
    if (dto.amount !== undefined) income.amount = dto.amount;
    if (dto.category !== undefined) income.category = dto.category;
    if (dto.invoiceNumber !== undefined) income.invoiceNumber = dto.invoiceNumber;
    if (dto.entryDate !== undefined) income.entryDate = new Date (dto.entryDate);
    if (dto.dueDate !== undefined) income.dueDate = new Date (dto.dueDate);
    
    return this.incomesRepo.save(income);
  }

  async remove(id: number) {
      const result = await this.incomesRepo.delete(id);
      if (result.affected === 0) {
        throw new NotFoundException(`Ingreso con ID ${id} no encontrado`);
      }
      return { message: 'Ingreso eliminado correctamente' };
    }

}
