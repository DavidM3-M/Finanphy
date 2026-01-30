import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import { SupplierOrder } from './entities/supplier-order.entity';
import { SupplierOrderItem } from './entities/supplier-order-item.entity';
import { Supplier } from '../suppliers/entities/supplier.entity';
import { Company } from 'src/companies/entities/company.entity';
import { Product } from 'src/products/entities/product.entity';
import { CreateSupplierOrderDto } from './dto/create-supplier-order.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SupplierOrdersService {
  constructor(
    @InjectRepository(SupplierOrder)
    private readonly ordersRepo: Repository<SupplierOrder>,

    @InjectRepository(SupplierOrderItem)
    private readonly orderItemRepo: Repository<SupplierOrderItem>,

    @InjectRepository(Supplier)
    private readonly supplierRepo: Repository<Supplier>,

    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,

    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,

    private readonly dataSource: DataSource,
  ) {}

  private generateOrderCode() {
    return `PO-${uuidv4().split('-')[0].toUpperCase()}`;
  }

  async createForUser(dto: CreateSupplierOrderDto, userId: string) {
    const supplier = await this.supplierRepo.findOne({
      where: { id: dto.supplierId },
    });
    if (!supplier) throw new NotFoundException('Proveedor no encontrado');
    const company = dto.companyId
      ? await this.companyRepo.findOne({ where: { id: dto.companyId } })
      : await this.companyRepo.findOne({ where: { userId } });
    if (!company) throw new NotFoundException('Compañía no encontrada');
    if (company.userId !== userId)
      throw new ForbiddenException('No tienes acceso a esta compañía');

    const products = await this.productRepo.find({
      where: { id: In(dto.items.map((i) => i.productId)) },
    });

    const items = dto.items.map((i) => {
      const p = products.find((pp) => String(pp.id) === String(i.productId));
      if (!p)
        throw new BadRequestException(`Producto no encontrado: ${i.productId}`);

      const item = new SupplierOrderItem();
      item.productId = String(p.id);
      item.quantity = i.quantity;
      item.unitPrice = p.price;
      return item;
    });

    const order = this.ordersRepo.create({
      supplier,
      supplierId: supplier.id,
      company,
      companyId: company.id,
      items,
      orderCode: this.generateOrderCode(),
      status: 'recibido',
    } as Partial<SupplierOrder>);

    return this.ordersRepo.save(order);
  }

  async attachInvoice(
    orderId: string,
    userId: string,
    file?: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Archivo requerido');
    const order = await this.ordersRepo.findOne({
      where: { id: orderId },
      relations: ['company', 'supplier'],
    });
    if (!order) throw new NotFoundException('Pedido no encontrado');
    if (order.company.userId !== userId)
      throw new ForbiddenException('No tienes acceso a este pedido');

    order.invoiceFilename = file.filename ?? null;
    order.invoiceMime = file.mimetype ?? null;
    order.invoiceSize = file.size ?? null;
    order.invoiceUploadedAt = new Date();
    order.invoiceUrl = `/uploads/${file.filename}`;
    return this.ordersRepo.save(order);
  }

  async confirmOrder(orderId: string, userId: string) {
    const order = await this.ordersRepo.findOne({
      where: { id: orderId },
      relations: ['company', 'supplier', 'items'],
    });
    if (!order) throw new NotFoundException('Pedido no encontrado');
    if (order.company.userId !== userId)
      throw new ForbiddenException('No tienes acceso a este pedido');

    // calculate total
    const total = order.items.reduce(
      (s, it) => s + Number(it.unitPrice) * Number(it.quantity),
      0,
    );

    await this.dataSource.transaction(async (manager) => {
      order.status = 'en_proceso';
      await manager.save(order);

      // increment supplier debt
      const supplier = await manager.findOne(Supplier, {
        where: { id: order.supplierId },
        lock: { mode: 'pessimistic_write' },
      });
      if (supplier) {
        supplier.debt = +(Number(supplier.debt ?? 0) + total).toFixed(2);
        await manager.save(supplier);
      }
    });

    return { orderCode: order.orderCode, total };
  }
}
