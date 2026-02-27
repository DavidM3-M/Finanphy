import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { ClientOrder } from '../client_orders/entities/client-order.entity';
import { CustomerPayment } from './entities/customer-payment.entity';
import { calculateOrderTotal } from '../client_orders/utils/calculate-order-total';
import { Company } from '../companies/entities/company.entity';
import { Income } from '../finance/entities/income.entity';

@Injectable()
export class CustomerPaymentsService {
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

  async listForUser(customerId: string, userId: string) {
    const customer = await this.customersRepo.findOne({
      where: { id: customerId },
    });
    if (!customer) throw new NotFoundException('Cliente no encontrado');

    const company = await this.companyRepo.findOne({
      where: { id: customer.companyId },
    });
    if (!company) throw new NotFoundException('Empresa no encontrada');
    if (company.userId !== userId)
      throw new ForbiddenException('No tienes acceso a este cliente');

    return this.paymentsRepo.find({
      where: { customerId },
      order: { paidAt: 'DESC' },
    });
  }

  async createForUser(
    customerId: string,
    userId: string,
    payload: {
      amount: number;
      paidAt?: string;
      paymentMethod?: string;
      note?: string;
      orderId?: string;
    },
    file?: Express.Multer.File,
  ) {
    if (!Number.isFinite(payload.amount) || payload.amount <= 0)
      throw new BadRequestException('amount inválido');

    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const manager = queryRunner.manager;

      const customer = await manager.findOne(Customer, {
        where: { id: customerId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!customer) throw new NotFoundException('Cliente no encontrado');

      const company = await manager.findOne(Company, {
        where: { id: customer.companyId },
      });
      if (!company) throw new NotFoundException('Empresa no encontrada');
      if (company.userId !== userId)
        throw new ForbiddenException('No tienes acceso a este cliente');

      const amt = Number(payload.amount);
      const currentDebt = Number(customer.debt ?? 0);

      if (amt > currentDebt)
        throw new BadRequestException(
          'amount supera la deuda actual del cliente',
        );

      let linkedOrder: ClientOrder | null = null;
      if (payload.orderId) {
        linkedOrder = await manager.findOne(ClientOrder, {
          where: { id: payload.orderId },
          relations: ['items'],
        });
        if (!linkedOrder) throw new NotFoundException('Orden no encontrada');
        if (linkedOrder.customerId !== customer.id)
          throw new BadRequestException('orderId no pertenece a este cliente');

        const orderTotal = calculateOrderTotal(linkedOrder.items);
        const existingPayments = await manager.find(CustomerPayment, {
          where: { orderId: linkedOrder.id },
        });
        const paidSum = existingPayments.reduce(
          (s, p) => s + Number(p.amount ?? 0),
          0,
        );
        const remainingOrder = +(orderTotal - paidSum).toFixed(2);
        if (amt > remainingOrder)
          throw new BadRequestException(
            'amount supera el saldo pendiente de la orden',
          );
      }

      customer.debt = +(currentDebt - amt).toFixed(2);
      const balanceAfter = Number(customer.debt);
      await manager.save(customer);

      const paymentData: Partial<CustomerPayment> = {
        customerId,
        amount: amt,
        paidAt: payload.paidAt ? new Date(payload.paidAt) : new Date(),
        paymentMethod: payload.paymentMethod ?? null,
        note: payload.note ?? null,
        orderId: payload.orderId ?? null,
        balanceAfter,
      };

      if (file) {
        paymentData.evidenceFilename = file.filename ?? null;
        paymentData.evidenceMime = file.mimetype ?? null;
        paymentData.evidenceSize = file.size ?? null;
        paymentData.evidenceUploadedAt = new Date();
        paymentData.evidenceUrl = `/uploads/${file.filename}`;
      }

      const payment = manager.create(CustomerPayment, paymentData as any);
      const saved = await manager.save(payment);

      // Crear Income para el abono evitando duplicados por invoiceNumber + companyId
      const incomePayload: Partial<Income> = {
        amount: amt,
        category: 'abono',
        invoiceNumber: linkedOrder?.orderCode ?? undefined,
        entryDate: paymentData.paidAt ?? new Date(),
        dueDate: undefined,
        company,
        orderId: linkedOrder?.id ?? null,
        customerId: customer.id,
      };

      if (incomePayload.invoiceNumber) {
        const existingIncome = await manager.findOne(Income, {
          where: {
            invoiceNumber: incomePayload.invoiceNumber,
            companyId: company.id,
          },
        });

        if (existingIncome) {
          if (!existingIncome.orderId && linkedOrder?.id) {
            existingIncome.orderId = linkedOrder.id;
            await manager.save(existingIncome);
          }
        } else {
          await manager.save(Income, incomePayload as any);
        }
      } else {
        await manager.save(Income, incomePayload as any);
      }

      // Actualizar paidAmount y paymentStatus de la orden vinculada
      if (linkedOrder) {
        const orderTotal = calculateOrderTotal(linkedOrder.items);
        const paymentsForOrder = await manager.find(CustomerPayment, {
          where: { orderId: linkedOrder.id },
        });
        const paidSum = paymentsForOrder.reduce(
          (s, p) => s + Number(p.amount ?? 0),
          0,
        );
        linkedOrder.paidAmount = +paidSum.toFixed(2);
        linkedOrder.balanceAfter = balanceAfter;
        linkedOrder.paymentStatus = paidSum >= orderTotal ? 'pagado' : 'deuda';
        await manager.save(linkedOrder);
      }

      await queryRunner.commitTransaction();
      return saved;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
