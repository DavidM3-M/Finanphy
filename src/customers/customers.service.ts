import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { ClientOrder } from '../client_orders/entities/client-order.entity';
import { CustomerPayment } from './entities/customer-payment.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Company } from '../companies/entities/company.entity';
import { validateCompanyOwnership } from '../common/helpers/validateCompanyOwnership';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customersRepo: Repository<Customer>,

    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,

    @InjectRepository(ClientOrder)
    private readonly ordersRepo: Repository<ClientOrder>,

    @InjectRepository(CustomerPayment)
    private readonly paymentsRepo: Repository<CustomerPayment>,

    private readonly dataSource: DataSource,
  ) {}

  async createForUser(dto: CreateCustomerDto, userId: string) {
    const company = await validateCompanyOwnership(
      this.companyRepo,
      dto.companyId,
      userId,
    );

    const debt = dto.debt !== undefined ? Number(dto.debt) : 0;
    const credit = dto.credit !== undefined ? Number(dto.credit) : 0;
    if (Number.isNaN(debt) || debt < 0) {
      throw new BadRequestException('debt inválido');
    }
    if (Number.isNaN(credit) || credit < 0) {
      throw new BadRequestException('credit inválido');
    }

    const [row] = await this.dataSource.query<Customer[]>(
      `SELECT * FROM sp_create_customer($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        dto.name,
        company.id,
        dto.email ?? null,
        dto.phone ?? null,
        dto.documentId ?? null,
        dto.address ?? null,
        dto.notes ?? null,
        debt,
        credit,
      ],
    );

    return row;
  }

  async findAllForUser(userId: string, companyId?: string) {
    let companyIds: string[] = [];

    if (companyId) {
      const company = await validateCompanyOwnership(
        this.companyRepo,
        companyId,
        userId,
      );
      companyIds = [company.id];
    } else {
      const companies = await this.companyRepo.find({ where: { userId } });
      companyIds = companies.map((c) => c.id);
    }

    if (companyIds.length === 0) return [];

    return this.customersRepo.find({
      where: companyIds.map((id) => ({ companyId: id })),
      order: { createdAt: 'DESC' },
    });
  }

  async findOneForUser(id: string, userId: string) {
    const customer = await this.customersRepo.findOne({ where: { id } });
    if (!customer) throw new NotFoundException('Cliente no encontrado');

    const company = await this.companyRepo.findOne({
      where: { id: customer.companyId },
    });

    if (!company) throw new ForbiddenException('Empresa no encontrada');
    if (company.userId !== userId)
      throw new ForbiddenException('No tienes acceso a este cliente');

    return customer;
  }

  async updateForUser(id: string, dto: UpdateCustomerDto, userId: string) {
    // Verificar propiedad antes de actualizar
    await this.findOneForUser(id, userId);

    if (!Object.keys(dto).length) {
      throw new BadRequestException('No update values provided');
    }

    // Los campos debt/credit se manejan directamente en el repositorio
    // porque sp_update_customer no los modifica (balance se maneja via pagos)
    if (dto.debt !== undefined || dto.credit !== undefined) {
      const customer = await this.customersRepo.findOne({ where: { id } });
      if (customer) {
        if (dto.debt !== undefined) {
          const d = dto.debt === null ? null : Number(dto.debt);
          if (d !== null && (Number.isNaN(d) || d < 0))
            throw new BadRequestException('debt inválido');
          customer.debt = d ?? 0;
        }
        if (dto.credit !== undefined) {
          const c = dto.credit === null ? null : Number(dto.credit);
          if (c !== null && (Number.isNaN(c) || c < 0))
            throw new BadRequestException('credit inválido');
          customer.credit = c ?? 0;
        }
        await this.customersRepo.save(customer);
      }
    }

    const [row] = await this.dataSource.query<Customer[]>(
      `SELECT * FROM sp_update_customer($1, $2, $3, $4, $5, $6, $7)`,
      [
        id,
        dto.name ?? null,
        dto.email ?? null,
        dto.phone ?? null,
        dto.documentId ?? null,
        dto.address ?? null,
        dto.notes ?? null,
      ],
    );

    return row;
  }

  async removeForUser(id: string, userId: string) {
    // Verificar propiedad antes de eliminar
    await this.findOneForUser(id, userId);

    await this.dataSource.query(`SELECT sp_delete_customer($1)`, [id]);

    return { message: 'Cliente eliminado correctamente' };
  }

  async debtSummaryForUser(id: string, userId: string) {
    const customer = await this.findOneForUser(id, userId);

    // fetch orders for this customer that are marked as 'deuda'
    const orders = await this.ordersRepo.find({
      where: { customerId: customer.id, paymentStatus: 'deuda' },
      relations: ['items'],
      order: { createdAt: 'DESC' },
    });

    // lazy import utility to calculate total
    // eslint-disable-next-line @typescript-eslint/no-var-requires, prettier/prettier
    const { calculateOrderTotal } = require('../client_orders/utils/calculate-order-total');

    const ordersMapped = orders.map((o) => {
      const total = calculateOrderTotal(o.items);
      const paid = Number(o.paidAmount ?? 0);
      const remaining = +(Math.max(0, total - paid)).toFixed(2);
      return {
        id: o.id,
        orderCode: o.orderCode,
        total,
        paidAmount: paid,
        remaining,
        status: o.status,
        invoiceUrl: o.invoiceUrl ?? null,
      };
    });

    const payments = await this.paymentsRepo.find({ where: { customerId: customer.id }, order: { paidAt: 'DESC' } });

    return {
      customerId: customer.id,
      customerName: customer.name,
      debt: Number(customer.debt ?? 0),
      credit: Number(customer.credit ?? 0),
      orders: ordersMapped,
      payments,
    };
  }
}
