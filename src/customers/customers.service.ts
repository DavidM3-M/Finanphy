import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

    const customer = this.customersRepo.create({
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      documentId: dto.documentId,
      address: dto.address,
      notes: dto.notes,
      companyId: company.id,
      debt,
      credit,
    });

    return this.customersRepo.save(customer);
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
    const customer = await this.findOneForUser(id, userId);

    if (!Object.keys(dto).length) {
      throw new BadRequestException('No update values provided');
    }

    customer.name = dto.name ?? customer.name;
    customer.email = dto.email ?? customer.email;
    customer.phone = dto.phone ?? customer.phone;
    customer.documentId = dto.documentId ?? customer.documentId;
    customer.address = dto.address ?? customer.address;
    customer.notes = dto.notes ?? customer.notes;
    if (dto.debt !== undefined) {
      const d = dto.debt === null ? null : Number(dto.debt);
      if (d !== null && (Number.isNaN(d) || d < 0)) {
        throw new BadRequestException('debt inválido');
      }
      customer.debt = d ?? 0;
    }
    if (dto.credit !== undefined) {
      const c = dto.credit === null ? null : Number(dto.credit);
      if (c !== null && (Number.isNaN(c) || c < 0))
        throw new BadRequestException('credit inválido');
      customer.credit = c ?? 0;
    }

    return this.customersRepo.save(customer);
  }

  async removeForUser(id: string, userId: string) {
    const customer = await this.findOneForUser(id, userId);
    return this.customersRepo.remove(customer);
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
    // eslint-disable-next-line @typescript-eslint/no-var-requires
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
