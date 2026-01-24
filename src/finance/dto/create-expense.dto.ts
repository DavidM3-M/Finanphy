// src/finance/dto/create-expense.dto.ts
import {
  IsNumber,
  IsString,
  IsOptional,
  Min,
  Length,
  IsDateString,
  IsUUID,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateExpenseDto {
  @IsNumber()
  @Min(0.01, { message: 'El gasto debe ser mayor a 0' })
  amount: number;

  @IsString()
  @Length(3, 50, { message: 'La categoría debe tener entre 3 y 50 caracteres' })
  category: string;

  @IsString()
  @Length(1, 200, {
    message: 'la descripcion debe llevar entre 1 y 200 caracteras',
  })
  description: string;

  @IsOptional()
  @IsString()
  @Length(3, 100, {
    message: 'El proveedor debe tener entre 3 y 100 caracteres',
  })
  supplier?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de entrada debe ser válida' })
  entryDate?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de vencimiento debe ser válida' })
  dueDate?: string;

  @IsOptional()
  @IsUUID('4', { message: 'El ID de empresa debe ser un UUID válido' })
  @Transform(({ value }) =>
    value === null || value === '' ? undefined : value,
  )
  companyId?: string;
}
