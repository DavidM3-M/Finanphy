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
      status: 'recibido',
      orderCode: generateOrderCode(),
      userId,
      customerId: customer?.id ?? null,
      customer: customer ?? undefined,
      description: description === undefined ? null : description,
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

  async confirmOrder(orderId: string) {
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

    // Use transaction to update order status and customer's debt atomically
    await this.dataSource.transaction(async (manager) => {
      order.status = 'en_proceso';
      await manager.save(order);

      if (order.customerId) {
        const customer = await manager.findOne(Customer, {
          where: { id: order.customerId },
          lock: { mode: 'pessimistic_write' },
        });
        if (customer) {
          const currentDebt = Number(customer.debt ?? 0);
          customer.debt = +(currentDebt + total).toFixed(2);
          await manager.save(customer);
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

  async updateStatus(
    orderId: string,
    status: 'recibido' | 'en_proceso' | 'enviado',
  ) {
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

      try {
        order.status = 'enviado';
        await queryRunner.manager.save(order);

        // crear ingreso: mapear valores null -> undefined para TypeORM DeepPartial
        const now = new Date();
        const incomePayload: Partial<Income> = {
          amount: total,
          category: 'venta',
          invoiceNumber: order.orderCode ?? undefined,
          entryDate: now, // instante actual
          dueDate: undefined,
          company: order.company,
          orderId: order.id,
          order,
        };

        const income = this.incomesRepo.create(incomePayload as any);
        await queryRunner.manager.save(income);

        await queryRunner.commitTransaction();

        const updated = await this.orderRepo.findOne({
          where: { id: order.id },
          relations: ['company', 'items', 'items.product', 'customer'],
        });

        return updated ?? order;
      } catch (err) {
        await queryRunner.rollbackTransaction();
        throw err;
      } finally {
        await queryRunner.release();
      }
    }

    order.status = status;
    return this.orderRepo.save(order);
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
