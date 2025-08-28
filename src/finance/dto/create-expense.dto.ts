// src/finance/dto/create-expense.dto.ts
import { IsNumber, IsString, IsOptional, Min, IsDateString } from 'class-validator';

export class CreateExpenseDto {
  @IsNumber()
  @Min(0.01, { message: 'El gasto debe ser mayor a 0' })
  amount: number;

  @IsString()
  category: string;  // Ej: "Compra de insumos", "Pago de servicios", etc.

  @IsOptional()
  @IsString()
  supplier?: string;  // Proveedor opcional

  @IsOptional()
  @IsDateString({},{ message: 'La fecha de salida debe ser una fecha válida' })
  exitDate?: string;

  @IsOptional()
  @IsDateString({},{ message: 'La fecha de vencimiento debe ser una fecha válida' })
  dueDate?: string;
}
