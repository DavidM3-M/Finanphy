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

import { calculateOrderTotal } from './utils/calculate-order-total';
import { validateStock } from './utils/validate-stock-before-confirm';
import { groupItemsByProduct } from './utils/group-items-by-product';
import { generateOrderCode } from './utils/generate-order-code';
import { formatOrderSummary } from './utils/format-order-summary';
import { Income } from 'src/finance/entities/income.entity';

type OrderItemInput = {
  productId: string | number;
  quantity: number;
};

@Injectable()
export class ClientOrdersService {
  constructor(
    @InjectRepository(ClientOrder)
    private readonly orderRepo: Repository<ClientOrder>,

    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,

    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,

    @InjectRepository(Income)
    private readonly incomesRepo: Repository<Income>,

    private readonly dataSource: DataSource,
  ) {}

  // Helper: reserva stock dentro de una transacción usando bloqueo pesimista
  private async reserveStockForOrder(queryRunner: QueryRunner, items: ClientOrderItem[]) {
    for (const item of items) {
      const prod = await queryRunner.manager.findOne(Product, {
        where: { id: item.productId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!prod) throw new NotFoundException(`Producto no encontrado: ${item.productId}`);

      const current = Number(prod.stock ?? 0);
      const qty = Number(item.quantity);

      if (!Number.isFinite(qty) || qty <= 0) throw new BadRequestException('Cantidad inválida');

      if (current < qty) {
        throw new BadRequestException(`Stock insuficiente para el producto ${prod.id}`);
      }

      prod.stock = current - qty;
      await queryRunner.manager.save(prod);
    }
  }

  // Helper: restaura stock dentro de una transacción usando bloqueo pesimista
  private async restoreStockForOrder(queryRunner: QueryRunner, items: ClientOrderItem[]) {
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

  async create(companyId: string, rawItems: OrderItemInput[], userId: string) {
    const company = await this.companyRepo.findOne({ where: { id: companyId } });
    if (!company) throw new NotFoundException('Compañía no encontrada');

    const normalizedItems = rawItems.map(i => ({
      productId: String(i.productId),
      quantity: i.quantity,
    }));

    const products = await this.productRepo.find({
      where: { id: In(normalizedItems.map(i => i.productId)) },
    });

    const orderItems: ClientOrderItem[] = normalizedItems.map(i => {
      const product = products.find(p => String(p.id) === i.productId);
      if (!product) {
        throw new BadRequestException(`Producto no encontrado: ${i.productId}`);
      }
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
    });

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Guardar la orden primero en la transacción (para tener id y relaciones)
      await queryRunner.manager.save(order);

      // Reservar stock para cada item
      await this.reserveStockForOrder(queryRunner, groupedItems);

      await queryRunner.commitTransaction();

      // Recargar la orden con relaciones para devolverla
      const saved = await this.orderRepo.findOne({
        where: { id: order.id },
        relations: ['company', 'items', 'items.product'],
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
      relations: ['company', 'items', 'items.product'],
    });
    if (!order) throw new NotFoundException('Pedido no encontrado');

    order.items = groupItemsByProduct(order.items);

    const products = await this.productRepo.find({
      where: { id: In(order.items.map(i => i.product.id)) },
    });

    const stockErrors = validateStock(order.items, products);
    if (stockErrors.length) throw new BadRequestException(stockErrors);

    const total = calculateOrderTotal(order.items);
    order.status = 'en_proceso';
    await this.orderRepo.save(order);

    const resumen = formatOrderSummary(order.items);
    return { orderCode: order.orderCode, total, resumen };
  }

  async getByCompany(companyId: string, userId: string) {
    const company = await this.companyRepo.findOne({ where: { id: companyId } });
    if (!company) throw new NotFoundException('Compañía no encontrada');

    const isReceiver = company.userId === userId;
    const where = isReceiver
      ? { company: { id: companyId } }
      : { company: { id: companyId }, user: { id: userId } };

    return this.orderRepo.find({
      where,
      relations: ['company', 'user', 'items', 'items.product'],
      order: { createdAt: 'DESC' },
    });
  }

  async getById(orderId: string, userId: string) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['company', 'user', 'items', 'items.product'],
    });
    if (!order) throw new NotFoundException('Pedido no encontrado');

    const isCreator = order.userId === userId;
    const isReceiver = order.company.userId === userId;
    if (!isCreator && !isReceiver) {
      throw new ForbiddenException('No tienes acceso a esta orden');
    }

    return order;
  }

  async getAll(userId: string) {
    return this.orderRepo.find({
      where: [
        { user: { id: userId } },
        { company: { userId: userId } },
      ],
      relations: ['company', 'user', 'items', 'items.product'],
      order: { createdAt: 'DESC' },
    });
  }

  // updateStatus ahora crea un Income cuando el status cambia a 'enviado'
  async updateStatus(
    orderId: string,
    status: 'recibido' | 'en_proceso' | 'enviado',
  ) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['company', 'items', 'items.product'],
    });
    if (!order) throw new NotFoundException('Pedido no encontrado');

    const prevStatus = order.status;
    if (prevStatus === status) {
      // No hay cambio; devolver la orden tal cual
      order.status = status;
      await this.orderRepo.save(order);
      return order;
    }

    // Si vamos a marcar como 'enviado' generamos ingreso
    if (status === 'enviado') {
      // calcular total
      order.items = groupItemsByProduct(order.items);
      const total = calculateOrderTotal(order.items);

      // crear Income dentro de una transacción junto con el cambio de estado
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // actualizar estado de orden
        order.status = 'enviado';
        await queryRunner.manager.save(order);

        // crear ingreso asociado a la compañía
        const income = this.incomesRepo.create({
          amount: total,
          category: 'venta',
          invoiceNumber: order.orderCode,
          entryDate: new Date(),
          dueDate: undefined,
          company: order.company,
        });

        await queryRunner.manager.save(income);

        await queryRunner.commitTransaction();

        // recargar orden con relaciones
        const updated = await this.orderRepo.findOne({
          where: { id: order.id },
          relations: ['company', 'items', 'items.product'],
        });

        return updated ?? order;
      } catch (err) {
        await queryRunner.rollbackTransaction();
        throw err;
      } finally {
        await queryRunner.release();
      }
    }

    // Para otros estados simplemente actualizar
    order.status = status;
    return this.orderRepo.save(order);
  }

  async deleteOrder(orderId: string, userId: string) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['company', 'user', 'items', 'items.product'],
    });

    if (!order) throw new NotFoundException('Orden no encontrada');

    const isCreator = order.userId === userId;
    const isReceiver = order.company.userId === userId;

    if (!isCreator && !isReceiver) {
      throw new ForbiddenException('No tienes permiso para eliminar esta orden');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Restaurar stock reservado por la orden
      await this.restoreStockForOrder(queryRunner, order.items);

      // Eliminar la orden dentro de la transacción
      await queryRunner.manager.remove(ClientOrder, order);

      await queryRunner.commitTransaction();
      return { message: 'Orden eliminada correctamente. El stock reservado fue devuelto al inventario' };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}