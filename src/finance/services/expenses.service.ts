// src/finance/services/expenses.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense } from '../entities/expense.entity';
import { CreateExpenseDto } from '../dto/create-expense.dto';
import { UpdateExpenseDto } from '../dto/update-expense.dto';
import { Company } from 'src/companies/entities/company.entity';
import {
  buildPaginatedResponse,
  parsePagination,
} from 'src/common/helpers/pagination';
import { validateCompanyOwnership } from 'src/common/helpers/validateCompanyOwnership';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private readonly expensesRepo: Repository<Expense>,

    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
  ) {}

  private async getDefaultCompanyForUser(userId: string): Promise<Company> {
    const companies = await this.companyRepo.find({ where: { userId } });

    if (companies.length === 0) {
      throw new ForbiddenException('No tienes empresas registradas');
    }

    if (companies.length > 1) {
      throw new BadRequestException('Debes especificar la empresa');
    }

    return companies[0];
  }

  async findAllByUser(userId: string, page?: string, limit?: string) {
    const { page: p, limit: l, offset } = parsePagination(page, limit);
    const [data, total] = await this.expensesRepo
      .createQueryBuilder('expense')
      .leftJoin('expense.company', 'company')
      .where('company.userId = :userId', { userId })
      .orderBy('expense.createdAt', 'DESC')
      .skip(offset)
      .take(l)
      .getManyAndCount();

    return buildPaginatedResponse(data, total, p, l);
  }

  async findOneByUser(id: number, userId: string) {
    const expense = await this.expensesRepo.findOne({
      where: { id },
      relations: ['company'],
    });

    if (!expense) throw new NotFoundException('Gasto no encontrado');
    if (expense.company.userId !== userId) {
      throw new ForbiddenException('No tienes acceso a este gasto');
    }

    return expense;
  }

  async createForUser(dto: CreateExpenseDto, userId: string) {
    const company = dto.companyId
      ? await validateCompanyOwnership(this.companyRepo, dto.companyId, userId)
      : await this.getDefaultCompanyForUser(userId);

    const expense = this.expensesRepo.create({
      amount: dto.amount,
      category: dto.category,
      description: dto.description,
      supplier: dto.supplier,
      entryDate: dto.entryDate ? new Date(dto.entryDate) : undefined,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      company,
    });

    return this.expensesRepo.save(expense);
  }

  async updateForUser(id: number, dto: UpdateExpenseDto, userId: string) {
    const expense = await this.findOneByUser(id, userId);

    expense.amount = dto.amount ?? expense.amount;
    expense.category = dto.category ?? expense.category;
    expense.supplier = dto.supplier ?? expense.supplier;
    expense.description = dto.description ?? expense.description;

    if (dto.entryDate) expense.entryDate = new Date(dto.entryDate);
    if (dto.dueDate) expense.dueDate = new Date(dto.dueDate);

    return this.expensesRepo.save(expense);
  }

  async removeForUser(id: number, userId: string) {
    const expense = await this.findOneByUser(id, userId);
    return this.expensesRepo.remove(expense);
  }
}
