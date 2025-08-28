// src/inventory/dto/create-movement.dto.ts
import { IsInt, IsPositive, IsString } from 'class-validator';

export class CreateMovementDto {
  @IsInt()
  productId: number;

  @IsInt()
  @IsPositive()
  quantity: number;

  @IsString()
  type: 'IN' | 'OUT'; // entrada o salida
}
