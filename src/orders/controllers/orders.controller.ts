// src/orders/controllers/orders.controller.ts
import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  ParseIntPipe, 
  HttpCode, 
  HttpStatus 
} from '@nestjs/common';
import { OrdersService } from 'src/orders/orders.service';
import { Order } from 'src/orders/entity/order.entity';
import { CreateOrderDto } from 'src/orders/dto/create-order.dto'
import { UpdateOrderDto } from 'src/orders/dto/update-order.dto'

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createOrderDto: CreateOrderDto): Promise<Order> {
    return this.ordersService.create(createOrderDto);
  }

  @Get()
  async findAll(): Promise<Order[]> {
    return this.ordersService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Order> {
    return this.ordersService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOrderDto: UpdateOrderDto,
  ): Promise<Order> {
    return this.ordersService.update(id, updateOrderDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.ordersService.remove(id);
  }

  @Get('stats/status')
  async getOrdersByStatus(): Promise<{ status: string; count: number }[]> {
    return this.ordersService.getOrdersByStatus();
  }

  @Get('stats/sales')
  async getTotalSales(): Promise<{ total: number }> {
    return this.ordersService.getTotalSales();
  }
}