import { PartialType } from '@nestjs/mapped-types';
import { CreateExpenseDto } from './create-expense.dto';
import { IsOptional, IsNumber, Min, IsDateString, IsString, MaxLength } from 'class-validator';

export class UpdateExpenseDto {
   @IsOptional()
  @IsString({ message: 'La descripción debe ser un texto' })
  @MaxLength(255, { message: 'La descripción no puede exceder 255 caracteres' })
  description?: string;

  @IsOptional()
  @IsNumber({}, { message: 'El monto debe ser un número' })
  @Min(0.01, { message: 'El monto debe ser mayor a 0' })
  amount?: number; // En COP

  @IsOptional()
  @IsString({ message: 'La categoría debe ser un texto' })
  @MaxLength(100, { message: 'La categoría no puede exceder 100 caracteres' })
  category?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha debe tener un formato válido' })
  date?: Date; 

}
