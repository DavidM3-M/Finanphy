import { Injectable, NotFoundException} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Investment } from '../investment.entity';
import { CreateInvestmentDto } from '../dto/create-investment.dto';
import { UpdateInvestmentDto } from '../dto/update-investment.dto';


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

  async update(id:number, dto: UpdateInvestmentDto){
    const investment = await this.findOne(id); // validar existencia
    Object.assign(investment, dto); // actualiza campos que llegan
    return this.investmentsRepository.save(investment);
  }
}
