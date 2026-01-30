import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Income } from '../entities/income.entity';
import { CreateIncomeDto } from '../dto/create-income.dto';
import { UpdateIncomeDto } from '../dto/update-income.dto';
import { Company } from 'src/companies/entities/company.entity';
import { validateCompanyOwnership } from 'src/common/helpers/validateCompanyOwnership';
import { Customer } from 'src/customers/entities/customer.entity';
import {
  buildPaginatedResponse,
  parsePagination,
} from 'src/common/helpers/pagination';

@Injectable()
export class IncomesService {
  constructor(
    @InjectRepository(Income)
    private readonly incomesRepo: Repository<Income>,

    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,

    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    private readonly dataSource: DataSource,
  ) {}

  private parseDateInput(v?: string): Date | null {
    if (!v) return null;
    // date-only YYYY-MM-DD -> treat as start of day UTC
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
      return new Date(`${v}T00:00:00.000Z`);
    }
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }

  async findAllByUser(userId: string, page?: string, limit?: string) {
    const { page: p, limit: l, offset } = parsePagination(page, limit);
    const [data, total] = await this.incomesRepo
      .createQueryBuilder('income')
      .leftJoin('income.company', 'company')
      .where('company.userId = :userId', { userId })
      .orderBy('income.createdAt', 'DESC')
      .skip(offset)
      .take(l)
      .getManyAndCount();

    return buildPaginatedResponse(data, total, p, l);
  }

  async findOneByUser(id: number, userId: string) {
    const income = await this.incomesRepo.findOne({
      where: { id },
      relations: ['company'],
    });

    if (!income) throw new NotFoundException('Ingreso no encontrado');
    if (!income.company)
      throw new ForbiddenException('Ingreso sin empresa asociada');
    if (income.company.userId !== userId) {
      throw new ForbiddenException('No tienes acceso a este ingreso');
    }

    return income;
  }

  async createForUser(dto: CreateIncomeDto, userId: string) {
    let company: Company;

    if (dto.companyId) {
      company = await validateCompanyOwnership(
        this.companyRepo,
        dto.companyId,
        userId,
      );
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

    const entryDateParsed = this.parseDateInput(dto.entryDate);
    const dueDateParsed = this.parseDateInput(dto.dueDate);

    // map null -> undefined to satisfy DeepPartial typing (no nulls)
    const entryDateForCreate = entryDateParsed ?? undefined;
    const dueDateForCreate = dueDateParsed ?? undefined;
    const invoiceNumberForCreate = dto.invoiceNumber ?? undefined;

    // create income and optionally apply to customer balance in a transaction
    return this.dataSource.transaction(async (manager) => {
      const inc = manager.create(Income, {
        amount: dto.amount,
        category: dto.category,
        description: dto.description,
        invoiceNumber: invoiceNumberForCreate,
        entryDate: entryDateForCreate,
        dueDate: dueDateForCreate,
        company,
        orderId: (dto as any).orderId ?? undefined,
        customerId: (dto as any).customerId ?? undefined,
      } as Partial<Income>);

      const saved = await manager.save(inc);

      // If linked to a customer, adjust balances
      if ((dto as any).customerId) {
        const customerId = (dto as any).customerId;
        const customer = await manager.findOne(Customer, {
          where: { id: customerId },
          lock: { mode: 'pessimistic_write' },
        });
        if (!customer) throw new NotFoundException('Cliente no encontrado');
        if (customer.companyId !== company.id)
          throw new ForbiddenException('Cliente no pertenece a la empresa');

        const amt = Number(dto.amount);
        const currentDebt = Number(customer.debt ?? 0);
        const currentCredit = Number(customer.credit ?? 0);
        let newDebt = currentDebt;
        let newCredit = currentCredit;

        if (currentDebt >= amt) {
          newDebt = +(currentDebt - amt).toFixed(2);
        } else {
          const remaining = +(amt - currentDebt).toFixed(2);
          newDebt = 0;
          newCredit = +(currentCredit + remaining).toFixed(2);
        }

        customer.debt = newDebt;
        customer.credit = newCredit;
        await manager.save(customer);
      }

      return saved;
    });
  }

  async updateForUser(id: number, dto: UpdateIncomeDto, userId: string) {
    const income = await this.findOneByUser(id, userId);

    income.amount = dto.amount ?? income.amount;
    income.category = dto.category ?? income.category;
    income.invoiceNumber = dto.invoiceNumber ?? income.invoiceNumber;
    income.description = dto.description ?? income.description;

    if (dto.entryDate !== undefined) {
      const parsed = this.parseDateInput(dto.entryDate);
      income.entryDate = parsed ?? income.entryDate;
    }

    if (dto.dueDate !== undefined) {
      const parsed = this.parseDateInput(dto.dueDate);
      income.dueDate = parsed ?? income.dueDate;
    }

    return this.incomesRepo.save(income);
  }

  async removeForUser(id: number, userId: string) {
    const income = await this.findOneByUser(id, userId);
    return this.incomesRepo.remove(income);
  }
}
