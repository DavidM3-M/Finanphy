import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ClientOrder } from './entities/client-order.entity';
import { ClientOrderItem } from './entities/client-order-item.entity';
import { Product } from '../products/entities/product.entity';
import { Company } from '../companies/entities/company.entity';

import { calculateOrderTotal } from './utils/calculate-order-total';
import { validateStock } from './utils/validate-stock-before-confirm';
import { groupItemsByProduct } from './utils/group-items-by-product';
import { generateOrderCode } from './utils/generate-order-code';
import { formatOrderSummary } from './utils/format-order-summary';

type OrderItemInput = {
  productId: string | number;
  quantity: number;
};

@Injectable()
export class ClientOrdersService {
  constructor(
    @InjectRepository(ClientOrder)
    private orderRepo: Repository<ClientOrder>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(Company)
    private companyRepo: Repository<Company>,
  ) {}

  async create(companyId: string, rawItems: OrderItemInput[]) {
    const company = await this.companyRepo.findOne({ where: { id: companyId } });
    if (!company) throw new NotFoundException('Compañía no encontrada');

    // 🔒 Normalizamos los items para forzar productId como string
    const normalizedItems = rawItems.map(i => ({
      productId: String(i.productId),
      quantity: i.quantity,
    }));

    const products = await this.productRepo.find({
      where: { id: In(normalizedItems.map(i => i.productId)) },
    });

    const orderItems: ClientOrderItem[] = normalizedItems.map(i => {
      const product = products.find(p => String(p.id) === String(i.productId));
      if (!product) {
        throw new BadRequestException(`Producto no encontrado: ${i.productId}`);
      }

      const item = new ClientOrderItem();
      item.productId = String(product.id); 
      item.quantity = i.quantity;
      item.unitPrice = product.price;
      item.product = product;
      item.orderId = companyId; 

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
    });

    return this.orderRepo.save(order);
  }

  async confirmOrder(orderId: string) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['items', 'items.product', 'company'],
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

  async getByCompany(companyId: string) {
    return this.orderRepo.find({
      where: { company: { id: companyId } },
      order: { createdAt: 'DESC' },
    });
  }

  async getAll() {
    return this.orderRepo.find({ order: { createdAt: 'DESC' } });
  }

  async updateStatus(
    orderId: string,
    status: 'recibido' | 'en_proceso' | 'enviado',
  ) {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Pedido no encontrado');

    order.status = status;
    return this.orderRepo.save(order);
  }
}