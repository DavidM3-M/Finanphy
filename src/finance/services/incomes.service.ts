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
    const customerId: string | null = (dto as any).customerId ?? null;
    const orderId: string | null = (dto as any).orderId ?? null;

    // Usar SP sp_create_income + ajuste de saldo en una transacción
    return this.dataSource.transaction(async (manager) => {
      // Verificar customer dentro de la misma transacción si aplica
      if (customerId) {
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

        if (currentDebt >= amt) {
          customer.debt = +(currentDebt - amt).toFixed(2);
        } else {
          const remaining = +(amt - currentDebt).toFixed(2);
          customer.debt = 0;
          customer.credit = +(currentCredit + remaining).toFixed(2);
        }
        await manager.save(customer);
      }

      // Llamar al procedimiento almacenado para crear el ingreso
      const [row] = await manager.query<Income[]>(
        `SELECT * FROM sp_create_income($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          dto.amount,
          dto.category,
          company.id,
          dto.description ?? null,
          dto.invoiceNumber ?? null,
          entryDateParsed ?? null,
          dueDateParsed ?? null,
          orderId,
          customerId,
        ],
      );

      return row;
    });
  }

  async updateForUser(id: number, dto: UpdateIncomeDto, userId: string) {
    // Verificar propiedad antes de actualizar
    await this.findOneByUser(id, userId);

    const entryDateParsed =
      dto.entryDate !== undefined
        ? (this.parseDateInput(dto.entryDate) ?? null)
        : null;
    const dueDateParsed =
      dto.dueDate !== undefined
        ? (this.parseDateInput(dto.dueDate) ?? null)
        : null;

    // Llamar al procedimiento almacenado para actualizar
    const [row] = await this.dataSource.query<Income[]>(
      `SELECT * FROM sp_update_income($1, $2, $3, $4, $5, $6, $7)`,
      [
        id,
        dto.amount ?? null,
        dto.category ?? null,
        dto.description ?? null,
        dto.invoiceNumber ?? null,
        entryDateParsed,
        dueDateParsed,
      ],
    );

    return row;
  }

  async removeForUser(id: number, userId: string) {
    // Verificar propiedad antes de eliminar
    await this.findOneByUser(id, userId);

    // Llamar al procedimiento almacenado para eliminar
    await this.dataSource.query(`SELECT sp_delete_income($1)`, [id]);

    return { message: 'Ingreso eliminado correctamente' };
  }
}
