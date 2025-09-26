import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Investment } from '../entities/investment.entity'; 
import { CreateInvestmentDto } from '../dto/create-investment.dto';
import { UpdateInvestmentDto } from '../dto/update-investment.dto';

@Injectable()
export class InvestmentsService {
  constructor(
    @InjectRepository(Investment)
    private investmentsRepository: Repository<Investment>,
  ) {}

  async create(dto: CreateInvestmentDto) {
    const newInvestment = this.investmentsRepository.create({
      amount: dto.amount,
      category: dto.category,
      invoiceNumber: dto.invoiceNumber,
      entryDate: dto.entryDate ? new Date(dto.entryDate) : undefined,
      exitDate: dto.exitDate ? new Date(dto.exitDate) : undefined,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
    });

    return this.investmentsRepository.save(newInvestment);
  }

  findAll() {
    return this.investmentsRepository.find();
  }

  async findOne(id: number) {
    const investment = await this.investmentsRepository.findOne({ where: { id } });
    if (!investment) throw new NotFoundException(`Inversión con ID ${id} no encontrada`);
    return investment;
  }

  async remove(id: number) {
    const result = await this.investmentsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Inversión con ID ${id} no encontrada`);
    }
    return { message: 'Inversión eliminada correctamente' };
  }

  async update(id: number, dto: UpdateInvestmentDto) {
    const investment = await this.findOne(id);

    if (dto.amount !== undefined) investment.amount = dto.amount;
    if (dto.category !== undefined) investment.category = dto.category;
    if (dto.invoiceNumber !== undefined) investment.invoiceNumber = dto.invoiceNumber;
    if (dto.entryDate !== undefined) investment.entryDate = new Date(dto.entryDate);
    if (dto.exitDate !== undefined) investment.exitDate = new Date(dto.exitDate);
    if (dto.dueDate !== undefined) investment.dueDate = new Date(dto.dueDate);

    return this.investmentsRepository.save(investment);
  }
}
