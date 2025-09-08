// src/orders/dto/update-order.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateOrderDto } from './create-order.dto';
import { IsOptional, IsNumber, Min, IsDateString, IsString, MaxLength, IsIn } from 'class-validator';

export class UpdateOrderDto extends PartialType(CreateOrderDto) {
  @IsOptional()
  @IsString({ message: 'El nombre del cliente debe ser un texto' })
  @MaxLength(255, { message: 'El nombre no puede exceder 255 caracteres' })
  customerName?: string;

  @IsOptional()
  @IsString({ message: 'El producto debe ser un texto' })
  @MaxLength(255, { message: 'El producto no puede exceder 255 caracteres' })
  product?: string;

  @IsOptional()
  @IsNumber({}, { message: 'El monto debe ser un número' })
  @Min(0.01, { message: 'El monto debe ser mayor a 0' })
  amount?: number;

  @IsOptional()
  @IsNumber({}, { message: 'La cantidad debe ser un número' })
  @Min(1, { message: 'La cantidad debe ser al menos 1' })
  quantity?: number;

  @IsOptional()
  @IsString({ message: 'El estado debe ser un texto' })
  @IsIn(['pending', 'completed', 'cancelled'], { message: 'El estado debe ser: pending, completed o cancelled' })
  status?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha del pedido debe tener un formato válido' })
  orderDate?: Date;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de entrega debe tener un formato válido' })
  deliveryDate?: Date;
}