/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource, QueryRunner } from 'typeorm';
import { ClientOrder } from './entities/client-order.entity';
import { ClientOrderItem } from './entities/client-order-item.entity';
import { Product } from '../products/entities/product.entity';
import { Company } from '../companies/entities/company.entity';
import { Customer } from 'src/customers/entities/customer.entity';
import fs from 'fs';
import path from 'path';

import { calculateOrderTotal } from './utils/calculate-order-total';
import { validateStock } from './utils/validate-stock-before-confirm';
import { groupItemsByProduct } from './utils/group-items-by-product';
import { generateOrderCode } from './utils/generate-order-code';
import { formatOrderSummary } from './utils/format-order-summary';
import { Income } from 'src/finance/entities/income.entity';
import {
  buildPaginatedResponse,
  parsePagination,
} from 'src/common/helpers/pagination';

type OrderItemInput = {
  productId: string | number;
  quantity: number;
};

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');

@Injectable()
export class ClientOrdersService {
  constructor(
    @InjectRepository(ClientOrder)
    private readonly orderRepo: Repository<ClientOrder>,

    @InjectRepository(ClientOrderItem)
    private readonly orderItemRepo: Repository<ClientOrderItem>,

    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,

    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,

    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,

    @InjectRepository(Income)
    private readonly incomesRepo: Repository<Income>,

    private readonly dataSource: DataSource,
  ) {}

  private async reserveStockForOrder(
    queryRunner: QueryRunner,
    items: ClientOrderItem[],
  ) {
    for (const item of items) {
      const prod = await queryRunner.manager.findOne(Product, {
        where: { id: item.productId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!prod)
        throw new NotFoundException(
          `Producto no encontrado: ${item.productId}`,
        );
      const current = Number(prod.stock ?? 0);
      const qty = Number(item.quantity);
      if (!Number.isFinite(qty) || qty <= 0)
        throw new BadRequestException('Cantidad inválida');
      if (current < qty)
        throw new BadRequestException(
          `Stock insuficiente para el producto ${prod.id}`,
        );
      prod.stock = current - qty;
      await queryRunner.manager.save(prod);
    }
  }

  private async restoreStockForOrder(
    queryRunner: QueryRunner,
    items: ClientOrderItem[],
  ) {
    for (const item of items) {
      const prod = await queryRunner.manager.findOne(Product, {
        where: { id: item.productId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!prod) continue;
      const current = Number(prod.stock ?? 0);
      const qty = Number(item.quantity);
      prod.stock = current + qty;
      await queryRunner.manager.save(prod);
    }
  }

  private applyInvoiceAttachment(
    order: ClientOrder,
    file?: Express.Multer.File,
  ) {
    if (!file) return;
    order.invoiceFilename = file.filename ?? null;
    order.invoiceMime = file.mimetype ?? null;
    order.invoiceSize = file.size ?? null;
    order.invoiceUploadedAt = new Date();
    order.invoiceUrl = `/uploads/${file.filename}`;
  }

  async create(
    companyId: string,
    rawItems: OrderItemInput[],
    userId: string,
    customerId?: string,
    description?: string | null,
    paymentMethod?: string | null,
  ) {
    const company = await this.companyRepo.findOne({
      where: { id: companyId },
    });
    if (!company) throw new NotFoundException('Compañía no encontrada');

    let customer: Customer | null = null;
    if (customerId) {
      customer = await this.customerRepo.findOne({
        where: { id: customerId, companyId: company.id },
      });
      if (!customer) {
        throw new NotFoundException('Cliente no encontrado');
      }
    }

    const normalizedItems = rawItems.map((i) => ({
      productId: String(i.productId),
      quantity: i.quantity,
    }));

    const products = await this.productRepo.find({
      where: { id: In(normalizedItems.map((i) => i.productId)) },
    });

    const orderItems: ClientOrderItem[] = normalizedItems.map((i) => {
      const product = products.find((p) => String(p.id) === i.productId);
      if (!product)
        throw new BadRequestException(`Producto no encontrado: ${i.productId}`);
      const item = new ClientOrderItem();
      item.productId = String(product.id);
      item.quantity = i.quantity;
      item.unitPrice = product.price;
      item.product = product;
      return item;
    });

    const groupedItems = groupItemsByProduct(orderItems);
    const stockErrors = validateStock(groupedItems, products);
    if (stockErrors.length) throw new BadRequestException(stockErrors);

    const order = this.orderRepo.create({
      company,
      items: groupedItems,
      status: 'sin_enviar',
      orderCode: generateOrderCode(),
      userId,
      customerId: customer?.id ?? null,
      customer: customer ?? undefined,
      description: description === undefined ? null : description,
      paymentMethod: paymentMethod ?? null,
    });

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.save(order);
      await this.reserveStockForOrder(queryRunner, groupedItems);
      await queryRunner.commitTransaction();
      const saved = await this.orderRepo.findOne({
        where: { id: order.id },
        relations: ['company', 'items', 'items.product', 'customer'],
      });
      return saved ?? order;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async confirmOrder(
    orderId: string,
    payment?: { paid?: boolean; paymentMethod?: string; amount?: number },
    file?: Express.Multer.File,
  ) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['company', 'items', 'items.product', 'customer'],
    });
    if (!order) throw new NotFoundException('Pedido no encontrado');

    order.items = groupItemsByProduct(order.items);
    const products = await this.productRepo.find({
      where: { id: In(order.items.map((i) => i.product.id)) },
    });

    const stockErrors = validateStock(order.items, products);
    if (stockErrors.length) throw new BadRequestException(stockErrors);

    const total = calculateOrderTotal(order.items);

    // Use transaction to update customer's debt/credit and order payment fields atomically
    await this.dataSource.transaction(async (manager) => {
      // reset payment fields
      order.paidAmount = null;
      order.paymentMethod = null;
      order.paymentAt = null;
      order.balanceAfter = null;
      // default payment status during confirmation: if no payment will become 'deuda'
      // leave as-is otherwise (entity default is 'generada')
      await manager.save(order);

      if (order.customerId) {
        // if a payment is provided and marked as paid, create customer payment
        if (payment?.paid) {
          const paidAmt = Number(payment.amount ?? total);
          // create CustomerPayment record and adjust customer balances
          // to avoid circular imports, use manager to insert into customer_payments and adjust Customer
          const customer = await manager.findOne(Customer, {
            where: { id: order.customerId },
            lock: { mode: 'pessimistic_write' },
          });
          if (!customer) throw new NotFoundException('Cliente no encontrado');

          const prevDebt = Number(customer.debt ?? 0);
          const prevCredit = Number(customer.credit ?? 0);

          // Apply payment first to previous debt
          const applyToPrevDebt = Math.min(prevDebt, paidAmt);
          let newDebt = +(prevDebt - applyToPrevDebt).toFixed(2);
          const remainingPayment = +(paidAmt - applyToPrevDebt).toFixed(2);

          // Then apply remaining payment to this order
          if (remainingPayment >= total) {
            // order fully covered and maybe extra -> credit
            const extra = +(remainingPayment - total).toFixed(2);
            customer.debt = newDebt;
            customer.credit = +(prevCredit + extra).toFixed(2);
            // order has been fully paid (and maybe credit)
            order.paymentStatus = extra > 0 ? 'credito' : 'pagado';
            newDebt = Number(customer.debt);
          } else {
            // partial or no coverage of order -> remaining order balance becomes debt
            const orderPending = +(total - remainingPayment).toFixed(2);
            customer.debt = +(newDebt + orderPending).toFixed(2);
            // no change to credit
            order.paymentStatus = orderPending > 0 ? 'deuda' : 'pagado';
            newDebt = Number(customer.debt);
          }

          await manager.save(customer);

          // insert payment record into customer_payments table
          const paymentRow: any = {
            customerId: customer.id,
            orderId: order.id,
            amount: paidAmt,
            paidAt: new Date(),
            paymentMethod: payment.paymentMethod ?? null,
            note: `Pago por orden ${order.orderCode}`,
            balanceAfter: newDebt,
          };
          if (file) {
            paymentRow.evidenceFilename = file.filename ?? null;
            paymentRow.evidenceMime = file.mimetype ?? null;
            paymentRow.evidenceSize = file.size ?? null;
            paymentRow.evidenceUploadedAt = new Date();
            paymentRow.evidenceUrl = `/uploads/${file.filename}`;
          }
          await manager.insert('customer_payments', paymentRow);

          // Create an Income record for this payment (abono)
          try {
            const incomeForPayment: Partial<Income> = {
              amount: paidAmt,
              category: 'abono',
              invoiceNumber: order.orderCode ?? undefined,
              entryDate: new Date(),
              dueDate: undefined,
              company: order.company,
              orderId: order.id,
              customerId: customer.id,
            };
            // use manager to persist within transaction
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            await manager.save(Income, incomeForPayment as any);
          } catch (e) {
            // non-fatal: if income creation fails, continue but log
            // eslint-disable-next-line no-console
            console.warn('No se pudo crear Income para el abono', e);
          }

          // populate order payment fields
          order.paidAmount = paidAmt;
          order.paymentMethod = payment.paymentMethod ?? null;
          order.paymentAt = new Date();
          order.balanceAfter = newDebt;

          await manager.save(order);

          // If order is fully paid, create an Income record for accounting (avoid duplicates)
          if (order.paymentStatus === 'pagado') {
            const now = new Date();
            const incomePayload: Partial<Income> = {
              amount: total,
              category: 'venta',
              invoiceNumber: order.orderCode ?? undefined,
              entryDate: now,
              dueDate: undefined,
              company: order.company,
              orderId: order.id,
              order,
            };

            let existingIncome: Income | null = null;
            if (incomePayload.invoiceNumber) {
              existingIncome = await manager.findOne(Income, {
                where: {
                  invoiceNumber: incomePayload.invoiceNumber,
                  companyId: order.company.id,
                },
              });
            }

            if (existingIncome) {
              if (!existingIncome.orderId) {
                existingIncome.orderId = order.id;
                await manager.save(existingIncome);
              }
            } else {
              const income = this.incomesRepo.create(incomePayload as any);
              await manager.save(income);
            }
          }
        } else {
          // no payment provided: increment debt by total
          const customer = await manager.findOne(Customer, {
            where: { id: order.customerId },
            lock: { mode: 'pessimistic_write' },
          });
          if (customer) {
            const currentDebt = Number(customer.debt ?? 0);
            customer.debt = +(currentDebt + total).toFixed(2);
            await manager.save(customer);
            // shipping status remains, payment is pending
            order.paymentStatus = 'deuda';
            await manager.save(order);
          }
        }
      }
    });

    const resumen = formatOrderSummary(order.items);
    return { orderCode: order.orderCode, total, resumen };
  }

  async getByCompany(
    companyId: string,
    userId: string,
    page?: string,
    limit?: string,
  ) {
    const company = await this.companyRepo.findOne({
      where: { id: companyId },
    });
    if (!company) throw new NotFoundException('Compañía no encontrada');

    const isReceiver = company.userId === userId;
    const where = isReceiver
      ? { company: { id: companyId } }
      : { company: { id: companyId }, user: { id: userId } };

    const { page: p, limit: l, offset } = parsePagination(page, limit);
    const [data, total] = await this.orderRepo.findAndCount({
      where,
      relations: ['company', 'user', 'items', 'items.product', 'customer'],
      order: { createdAt: 'DESC' },
      skip: offset,
      take: l,
    });

    return buildPaginatedResponse(data, total, p, l);
  }

  async getById(orderId: string, userId: string) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['company', 'user', 'items', 'items.product', 'customer'],
    });
    if (!order) throw new NotFoundException('Pedido no encontrado');

    const isCreator = order.userId === userId;
    const isReceiver = order.company.userId === userId;
    if (!isCreator && !isReceiver)
      throw new ForbiddenException('No tienes acceso a esta orden');

    return order;
  }

  async getAll(userId: string, page?: string, limit?: string) {
    const { page: p, limit: l, offset } = parsePagination(page, limit);
    const [data, total] = await this.orderRepo.findAndCount({
      where: [{ user: { id: userId } }, { company: { userId: userId } }],
      relations: ['company', 'user', 'items', 'items.product', 'customer'],
      order: { createdAt: 'DESC' },
      skip: offset,
      take: l,
    });

    return buildPaginatedResponse(data, total, p, l);
  }

  async getByCompanyAndCustomer(
    companyId: string,
    customerId: string,
    userId: string,
    page?: string,
    limit?: string,
  ) {
    const company = await this.companyRepo.findOne({
      where: { id: companyId },
    });
    if (!company) throw new NotFoundException('Compañía no encontrada');

    const isReceiver = company.userId === userId;
    const where = isReceiver
      ? {
          company: { id: companyId },
          customerId,
          paymentStatus: 'deuda' as ClientOrder['paymentStatus'],
        }
      : {
          company: { id: companyId },
          user: { id: userId },
          customerId,
          paymentStatus: 'deuda' as ClientOrder['paymentStatus'],
        };

    const { page: p, limit: l, offset } = parsePagination(page, limit);
    const [data, total] = await this.orderRepo.findAndCount({
      where,
      relations: ['company', 'user', 'items', 'items.product', 'customer'],
      order: { createdAt: 'DESC' },
      skip: offset,
      take: l,
    });

    const mapped = data.map((order) => ({
      id: order.id,
      orderCode: order.orderCode,
      total: calculateOrderTotal(order.items),
      status: order.status,
      paymentStatus: order.paymentStatus,
      invoiceUrl: order.invoiceUrl ?? null,
      invoiceFilename: order.invoiceFilename ?? null,
      issuedAt: order.issuedAt,
      customerId: order.customerId ?? null,
    }));

    return buildPaginatedResponse(mapped, total, p, l);
  }

  async updateStatus(orderId: string, status: 'sin_enviar' | 'enviado') {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['company', 'items', 'items.product', 'customer'],
    });
    if (!order) throw new NotFoundException('Pedido no encontrado');

    const prevStatus = order.status;
    if (prevStatus === status) {
      order.status = status;
      await this.orderRepo.save(order);
      return order;
    }

    if (status === 'enviado') {
      order.items = groupItemsByProduct(order.items);
      const total = calculateOrderTotal(order.items);

      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      // declare incomePayload in outer scope so the catch block can reference it
      let incomePayload: Partial<Income> = {} as Partial<Income>;

      try {
        order.status = 'enviado';
        await queryRunner.manager.save(order);

        // crear ingreso: mapear valores null -> undefined para TypeORM DeepPartial
        const now = new Date();
        incomePayload = {
          amount: total,
          category: 'venta',
          invoiceNumber: order.orderCode ?? undefined,
          entryDate: now, // instante actual
          dueDate: undefined,
          company: order.company,
          orderId: order.id,
          order,
        };

        // Avoid creating duplicate Income records for the same invoice + company
        let existingIncome: Income | null = null;
        if (incomePayload.invoiceNumber) {
          existingIncome = await queryRunner.manager.findOne(Income, {
            where: {
              invoiceNumber: incomePayload.invoiceNumber,
              companyId: order.company.id,
            },
          });
        }

        if (existingIncome) {
          // If existing income has no linked order, attach this order id
          if (!existingIncome.orderId) {
            existingIncome.orderId = order.id;
            await queryRunner.manager.save(existingIncome);
          }
        } else {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          const income = this.incomesRepo.create(incomePayload as any);
          await queryRunner.manager.save(income);
        }

        await queryRunner.commitTransaction();

        const updated = await this.orderRepo.findOne({
          where: { id: order.id },
          relations: ['company', 'items', 'items.product', 'customer'],
        });

        return updated ?? order;
      } catch (err) {
        // Handle unique constraint violation for invoiceNumber + companyId
        // If another process inserted the Income concurrently, try to link it
        try {
          // Postgres unique violation code
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          const pgCode = err?.driverError?.code ?? err?.code ?? null;
          if (pgCode === '23505' && incomePayload.invoiceNumber) {
            const existing = await queryRunner.manager.findOne(Income, {
              where: {
                invoiceNumber: incomePayload.invoiceNumber,
                companyId: order.company.id,
              },
            });

            if (existing) {
              if (!existing.orderId) {
                existing.orderId = order.id;
                await queryRunner.manager.save(existing);
              }
              await queryRunner.commitTransaction();
              const updated = await this.orderRepo.findOne({
                where: { id: order.id },
                relations: ['company', 'items', 'items.product', 'customer'],
              });
              return updated ?? order;
            }
          }
        } catch (inner) {
          // log inner error but fallthrough to rollback + rethrow original
          // eslint-disable-next-line no-console
          console.warn('Error handling duplicate income', inner);
        }

        await queryRunner.rollbackTransaction();
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        throw err;
      } finally {
        await queryRunner.release();
      }
    }

    order.status = status;
    return this.orderRepo.save(order);
  }

  async updateOrder(
    orderId: string,
    dto: { items?: { productId: string; quantity: number }[]; customerId?: string; description?: string; paymentMethod?: string },
    userId: string,
  ) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['company', 'user', 'items', 'items.product', 'customer'],
    });
    if (!order) throw new NotFoundException('Pedido no encontrado');

    const isCreator = order.userId === userId;
    const isReceiver = order.company.userId === userId;
    if (!isCreator && !isReceiver) throw new ForbiddenException('No tienes permiso para editar esta orden');

    if (order.status === 'enviado') {
      throw new BadRequestException('No se puede editar una orden ya enviada');
    }

    // If no items provided, just update metadata fields
    const needsItemUpdate = Array.isArray(dto.items) && dto.items.length > 0;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (needsItemUpdate) {
        // restore stock for current items
        await this.restoreStockForOrder(queryRunner, order.items);

        // build new items
        const normalizedItems = dto.items!.map((i) => ({ productId: String(i.productId), quantity: i.quantity }));
        const products = await this.productRepo.find({ where: { id: In(normalizedItems.map((i) => i.productId)) } });

        const orderItems: ClientOrderItem[] = normalizedItems.map((i) => {
          const product = products.find((p) => String(p.id) === i.productId);
          if (!product) throw new BadRequestException(`Producto no encontrado: ${i.productId}`);
          const item = new ClientOrderItem();
          item.productId = String(product.id);
          item.quantity = i.quantity;
          item.unitPrice = product.price;
          item.product = product;
          return item;
        });

        const groupedItems = groupItemsByProduct(orderItems);
        const stockErrors = validateStock(groupedItems, products);
        if (stockErrors.length) throw new BadRequestException(stockErrors);

        // delete existing items and save new ones (using manager)
        // delete by order id to remove previous items
        await queryRunner.manager.delete(ClientOrderItem, { order: { id: order.id } });
        for (const it of groupedItems) {
          // create a proper entity instance and attach the order relation
          const newItem = new ClientOrderItem();
          // ensure orderId is explicitly set so the FK is never null when saving
          newItem.orderId = order.id as any;
          // keep order relation when possible
          newItem.order = order as any;
          newItem.productId = String((it as any).productId ?? (it as any).product?.id ?? (it as any).product);
          newItem.quantity = Number((it as any).quantity ?? 0);
          newItem.unitPrice = (it as any).unitPrice ?? (it as any).product?.price ?? 0;
          // attach product entity when available
          if ((it as any).product) newItem.product = (it as any).product;
          await queryRunner.manager.save(ClientOrderItem, newItem as any);
        }

        // reserve stock for new items
        await this.reserveStockForOrder(queryRunner, groupedItems as ClientOrderItem[]);
      }

      // update other fields
      if (dto.customerId !== undefined) order.customerId = dto.customerId ?? null;
      if (dto.description !== undefined) order.description = dto.description === undefined ? null : dto.description;
      if (dto.paymentMethod !== undefined) order.paymentMethod = dto.paymentMethod ?? null;

      const saved = await queryRunner.manager.save(order);
      await queryRunner.commitTransaction();

      const updated = await this.orderRepo.findOne({ where: { id: order.id }, relations: ['company', 'user', 'items', 'items.product', 'customer'] });
      return updated ?? saved;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async deleteOrder(orderId: string, userId: string) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['company', 'user', 'items', 'items.product', 'customer'],
    });

    if (!order) throw new NotFoundException('Orden no encontrada');

    const isCreator = order.userId === userId;
    const isReceiver = order.company.userId === userId;

    if (!isCreator && !isReceiver)
      throw new ForbiddenException(
        'No tienes permiso para eliminar esta orden',
      );
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await this.restoreStockForOrder(queryRunner, order.items);

      if (order.invoiceFilename) {
        const fileOnDisk = path.resolve(UPLOADS_DIR, order.invoiceFilename);
        try {
          if (fs.existsSync(fileOnDisk)) fs.unlinkSync(fileOnDisk);
        } catch {
          // no-op: we don't want file removal errors to block order deletion
        }
      }

      await queryRunner.manager.remove(ClientOrder, order);
      await queryRunner.commitTransaction();
      return {
        message:
          'Orden eliminada correctamente. El stock reservado fue devuelto al inventario',
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async attachInvoice(
    orderId: string,
    userId: string,
    file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Archivo requerido');
    }

    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['company', 'user'],
    });
    if (!order) throw new NotFoundException('Pedido no encontrado');

    const isCreator = order.userId === userId;
    const isReceiver = order.company.userId === userId;
    if (!isCreator && !isReceiver) {
      throw new ForbiddenException('No tienes acceso a esta orden');
    }

    this.applyInvoiceAttachment(order, file);
    return this.orderRepo.save(order);
  }

  async removeInvoice(orderId: string, userId: string) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['company', 'user'],
    });
    if (!order) throw new NotFoundException('Pedido no encontrado');

    const isCreator = order.userId === userId;
    const isReceiver = order.company.userId === userId;
    if (!isCreator && !isReceiver) {
      throw new ForbiddenException('No tienes acceso a esta orden');
    }

    if (order.invoiceFilename) {
      const fileOnDisk = path.resolve(UPLOADS_DIR, order.invoiceFilename);
      try {
        if (fs.existsSync(fileOnDisk)) fs.unlinkSync(fileOnDisk);
      } catch {
        // no-op, keep DB update even if file removal fails
      }
    }

    order.invoiceUrl = null;
    order.invoiceFilename = null;
    order.invoiceMime = null;
    order.invoiceSize = null;
    order.invoiceUploadedAt = null;

    return this.orderRepo.save(order);
  }
}
