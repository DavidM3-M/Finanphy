// src/orders/services/orders.service.ts
import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entity/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    try {
      const order = this.orderRepository.create({
        ...createOrderDto,
        quantity: createOrderDto.quantity || 1,
        status: createOrderDto.status || 'pending'
      });
      return await this.orderRepository.save(order);
    } catch (error) {
      throw new InternalServerErrorException('Error al crear el pedido');
    }
  }

  async findAll(): Promise<Order[]> {
    try {
      return await this.orderRepository.find({
        order: { orderDate: 'DESC' }
      });
    } catch (error) {
      throw new InternalServerErrorException('Error al obtener los pedidos');
    }
  }

  async findOne(id: number): Promise<Order> {
    try {
      const order = await this.orderRepository.findOne({ where: { id } });
      
      if (!order) {
        throw new NotFoundException(`Pedido con ID ${id} no encontrado`);
      }
      
      return order;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Error al obtener el pedido');
    }
  }

  async update(id: number, updateOrderDto: UpdateOrderDto): Promise<Order> {
    try {
      await this.findOne(id);
      await this.orderRepository.update(id, updateOrderDto);
      return await this.findOne(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Error al actualizar el pedido');
    }
  }

  async remove(id: number): Promise<void> {
    try {
      await this.findOne(id);
      const result = await this.orderRepository.delete(id);
      
      if (result.affected === 0) {
        throw new NotFoundException(`Pedido con ID ${id} no encontrado`);
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Error al eliminar el pedido');
    }
  }

  async getOrdersByStatus(): Promise<{ status: string; count: number }[]> {
    try {
      const query = `
        SELECT status, COUNT(*) as count 
        FROM orders 
        GROUP BY status 
        ORDER BY count DESC
      `;
      
      return await this.orderRepository.query(query);
    } catch (error) {
      throw new InternalServerErrorException('Error al obtener pedidos por estado');
    }
  }

  async getTotalSales(): Promise<{ total: number }> {
    try {
      const query = `
        SELECT SUM(amount * quantity) as total 
        FROM orders 
        WHERE status = 'completed'
      `;
      
      const result = await this.orderRepository.query(query);
      return { total: result[0].total || 0 };
    } catch (error) {
      throw new InternalServerErrorException('Error al obtener el total de ventas');
    }
  }
}