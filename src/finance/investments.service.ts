import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Investment } from './investment.entity';
import { CreateInvestmentDto } from './dto/create-investment.dto';

@Injectable()
export class InvestmentsService {
  constructor(
    @InjectRepository(Investment)
    private investmentsRepository: Repository<Investment>,
  ) {}

  create(data: CreateInvestmentDto) {
    const newInvestment = this.investmentsRepository.create(data);
    return this.investmentsRepository.save(newInvestment);
  }

  findAll() {
    return this.investmentsRepository.find();
  }

  findOne(id: number) {
    return this.investmentsRepository.findOne({ where: { id } });
  }

  async remove(id: number) {
    await this.investmentsRepository.delete(id);
    return { message: 'Inversión eliminada correctamente' };
  }
}
