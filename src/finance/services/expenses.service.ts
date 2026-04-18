// src/finance/services/expenses.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
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

    private readonly dataSource: DataSource,
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

    const [row] = await this.dataSource.query<Expense[]>(
      `SELECT * FROM sp_create_expense($1, $2, $3, $4, $5, $6, $7)`,
      [
        dto.amount,
        dto.category,
        company.id,
        dto.description ?? null,
        dto.supplier ?? null,
        dto.entryDate ? new Date(dto.entryDate) : null,
        dto.dueDate ? new Date(dto.dueDate) : null,
      ],
    );

    return row;
  }

  async updateForUser(id: number, dto: UpdateExpenseDto, userId: string) {
    // Verificar propiedad antes de actualizar
    await this.findOneByUser(id, userId);

    const [row] = await this.dataSource.query<Expense[]>(
      `SELECT * FROM sp_update_expense($1, $2, $3, $4, $5, $6, $7)`,
      [
        id,
        dto.amount ?? null,
        dto.category ?? null,
        dto.description ?? null,
        dto.supplier ?? null,
        dto.entryDate ? new Date(dto.entryDate) : null,
        dto.dueDate ? new Date(dto.dueDate) : null,
      ],
    );

    return row;
  }

  async removeForUser(id: number, userId: string) {
    // Verificar propiedad antes de eliminar
    await this.findOneByUser(id, userId);

    await this.dataSource.query(`SELECT sp_delete_expense($1)`, [id]);

    return { message: 'Gasto eliminado correctamente' };
  }

  async attachInvoice(id: number, userId: string, file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('Archivo requerido');
    const expense = await this.expensesRepo.findOne({
      where: { id },
      relations: ['company'],
    });
    if (!expense) throw new NotFoundException('Gasto no encontrado');
    if (expense.company.userId !== userId)
      throw new ForbiddenException('No tienes acceso a este gasto');

    expense.invoiceFilename = file.filename ?? null;
    expense.invoiceMime = file.mimetype ?? null;
    expense.invoiceSize = file.size ?? null;
    expense.invoiceUploadedAt = new Date();
    expense.invoiceUrl = `/uploads/invoices/expenses/${file.filename}`;
    return this.expensesRepo.save(expense);
  }
}
