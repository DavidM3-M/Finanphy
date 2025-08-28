// src/finance/dto/create-income.dto.ts
import { IsNumber, IsString, IsOptional, Min, Length,IsDateString } from 'class-validator';

export class CreateIncomeDto {
  @IsNumber() 
  @Min(0.01, { message: 'El ingreso debe ser mayor a 0' })
  amount: number;

  @IsString()
  @Length(3, 50, {message: 'La categoría debe tener entre 3 y 50 caracteres'})
  category: string;  // Ej: "Venta de producto", "Servicio", etc.

  @IsOptional()
  @IsString()
  @Length(0, 20, {message: 'El número de factura no debe exceder los 20 caracteres'})
  invoiceNumber?: string;  // Número de factura opcional

  @IsOptional()
  @IsDateString({},{ message: 'La fecha de entrada debe ser una fecha válida' })
  entryDate?: string;

  @IsOptional()
  @IsDateString({},{ message: 'La fecha de vencimiento debe ser una fecha válida' })
  dueDate?: string;
}
