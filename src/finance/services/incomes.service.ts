import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Income } from '../entities/income.entity';
import { CreateIncomeDto } from '../dto/create-income.dto';
import { UpdateIncomeDto } from '../dto/update-income.dto';
import { Company } from 'src/companies/entities/company.entity';
import { validateCompanyOwnership } from 'src/common/helpers/validateCompanyOwnership';

@Injectable()
export class IncomesService {
  constructor(
    @InjectRepository(Income)
    private readonly incomesRepo: Repository<Income>,

    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
  ) {}

  async findAllByUser(userId: string) {
    return this.incomesRepo
      .createQueryBuilder('income')
      .leftJoin('income.company', 'company')
      .where('company.userId = :userId', { userId })
      .getMany();
  }

  async findOneByUser(id: number, userId: string) {
    const income = await this.incomesRepo.findOne({
      where: { id },
      relations: ['company'],
    });

    if (!income) throw new NotFoundException('Ingreso no encontrado');
    if (!income.company) throw new ForbiddenException('Ingreso sin empresa asociada');
    if (income.company.userId !== userId) {
      throw new ForbiddenException('No tienes acceso a este ingreso');
    }

    return income;
  }

  async createForUser(dto: CreateIncomeDto, userId: string) {
    let company: Company;

    if (dto.companyId) {
      company = await validateCompanyOwnership(this.companyRepo, dto.companyId, userId);
    } else {
      const companies = await this.companyRepo.find({ where: { userId } });

      if (companies.length === 0) {
        throw new ForbiddenException('No tienes empresas registradas');
      }

      if (companies.length > 1) {
        throw new BadRequestException('Debes especificar la empresa');
      }

      company = companies[0];
    }

    const income = this.incomesRepo.create({
      amount: dto.amount,
      category: dto.category,
      invoiceNumber: dto.invoiceNumber,
      entryDate: dto.entryDate ? new Date(dto.entryDate) : undefined,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      company,
    });

    return this.incomesRepo.save(income);
  }

  async updateForUser(id: number, dto: UpdateIncomeDto, userId: string) {
    const income = await this.findOneByUser(id, userId);

    income.amount = dto.amount ?? income.amount;
    income.category = dto.category ?? income.category;
    income.invoiceNumber = dto.invoiceNumber ?? income.invoiceNumber;

    if (dto.entryDate) {
      income.entryDate = new Date(dto.entryDate);
    }

    if (dto.dueDate) {
      income.dueDate = new Date(dto.dueDate);
    }

    return this.incomesRepo.save(income);
  }

  async removeForUser(id: number, userId: string) {
    const income = await this.findOneByUser(id, userId);
    return this.incomesRepo.remove(income);
  }
}