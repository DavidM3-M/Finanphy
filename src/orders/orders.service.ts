// src/orders/orders.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entity/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Company } from '../companies/entities/company.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
  ) {}

  async create(createOrderDto: CreateOrderDto, userId: string): Promise<Order> {
    // Verificar que la empresa pertenece al usuario
    const company = await this.companyRepository.findOne({
      where: { 
        id: createOrderDto.companyId, 
        userId: userId 
      },
    });

    if (!company) {
      throw new ForbiddenException('No tienes acceso a esta empresa');
    }

    // Verificar que el número de orden no existe para esta empresa
    const existingOrder = await this.orderRepository.findOne({
      where: { 
        orderNumber: createOrderDto.orderNumber, 
        companyId: createOrderDto.companyId 
      },
    });

    if (existingOrder) {
      throw new BadRequestException(
        'Ya existe una orden con este número para esta empresa'
      );
    }

    // Crear la orden usando create sin especificar tipos manualmente
    const order = this.orderRepository.create({
      companyId: createOrderDto.companyId,
      orderNumber: createOrderDto.orderNumber,
      totalAmount: createOrderDto.totalAmount,
      status: createOrderDto.status,
      customerName: createOrderDto.customerName,
      customerEmail: createOrderDto.customerEmail,
      customerPhone: createOrderDto.customerPhone,
      description: createOrderDto.description,
      deliveryDate: createOrderDto.deliveryDate ? new Date(createOrderDto.deliveryDate) : undefined,
    });

    return await this.orderRepository.save(order);
  }

  async findAllByUser(userId: string): Promise<Order[]> {
    return await this.orderRepository
      .createQueryBuilder('order')
      .innerJoinAndSelect('order.company', 'company')
      .where('company.userId = :userId', { userId })
      .orderBy('order.createdAt', 'DESC')
      .getMany();
  }

  async findByCompany(companyId: string, userId: string): Promise<Order[]> {
    // Verificar que la empresa pertenece al usuario
    const company = await this.companyRepository.findOne({
      where: { id: companyId, userId: userId },
    });

    if (!company) {
      throw new ForbiddenException('No tienes acceso a esta empresa');
    }

    return await this.orderRepository.find({
      where: { companyId },
      relations: ['company'],
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string, userId: string): Promise<Order> {
    const order = await this.orderRepository
      .createQueryBuilder('order')
      .innerJoinAndSelect('order.company', 'company')
      .where('order.id = :id', { id })
      .andWhere('company.userId = :userId', { userId })
      .getOne();

    if (!order) {
      throw new NotFoundException('Orden no encontrada o sin acceso');
    }

    return order;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto, userId: string): Promise<Order> {
    const order = await this.findById(id, userId);

    if (updateOrderDto.orderNumber && updateOrderDto.orderNumber !== order.orderNumber) {
      const existingOrder = await this.orderRepository.findOne({
        where: { 
          orderNumber: updateOrderDto.orderNumber, 
          companyId: order.companyId 
        },
      });

      if (existingOrder && existingOrder.id !== id) {
        throw new BadRequestException(
          'Ya existe una orden con este número para esta empresa'
        );
      }
    }

    // Preparar datos de actualización sin tipado explícito
    const updateData: any = {};
    
    if (updateOrderDto.orderNumber !== undefined) {
      updateData.orderNumber = updateOrderDto.orderNumber;
    }
    if (updateOrderDto.totalAmount !== undefined) {
      updateData.totalAmount = updateOrderDto.totalAmount;
    }
    if (updateOrderDto.status !== undefined) {
      updateData.status = updateOrderDto.status;
    }
    if (updateOrderDto.customerName !== undefined) {
      updateData.customerName = updateOrderDto.customerName;
    }
    if (updateOrderDto.customerEmail !== undefined) {
      updateData.customerEmail = updateOrderDto.customerEmail;
    }
    if (updateOrderDto.customerPhone !== undefined) {
      updateData.customerPhone = updateOrderDto.customerPhone;
    }
    if (updateOrderDto.description !== undefined) {
      updateData.description = updateOrderDto.description;
    }
    if (updateOrderDto.deliveryDate !== undefined) {
      updateData.deliveryDate = updateOrderDto.deliveryDate ? new Date(updateOrderDto.deliveryDate) : undefined;
    }

    // Actualizar
    await this.orderRepository.update(id, updateData);
    
    // Retornar orden actualizada
    return await this.findById(id, userId);
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.findById(id, userId);
    const result = await this.orderRepository.delete(id);
    
    if (result.affected === 0) {
      throw new NotFoundException('Orden no encontrada');
    }
  }

  async getOrderStats(companyId: string, userId: string) {
    const company = await this.companyRepository.findOne({
      where: { id: companyId, userId: userId },
    });

    if (!company) {
      throw new ForbiddenException('No tienes acceso a esta empresa');
    }

    const stats = await this.orderRepository
      .createQueryBuilder('order')
      .select('order.status', 'status')
      .addSelect('COUNT(order.id)', 'count')
      .addSelect('SUM(CAST(order.totalAmount AS DECIMAL))', 'total')
      .where('order.companyId = :companyId', { companyId })
      .groupBy('order.status')
      .getRawMany();

    return stats.map(stat => ({
      status: stat.status,
      count: parseInt(stat.count) || 0,
      total: parseFloat(stat.total) || 0
    }));
  }
}