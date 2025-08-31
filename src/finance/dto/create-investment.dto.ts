import { IsNumber,Min, IsString,IsOptional, IsDateString,Length} from "class-validator";
import { Type } from "class-transformer";

export class CreateInvestmentDto {
  @Type(() => Number)
  @IsNumber({}, { message: 'El monto debe ser un número válido' })
  @Min(0.01, { message: 'La inversión debe ser mayor a 0' })
  amount: number;

  @IsString({ message: 'La categoría debe ser texto' })
  @Length(3, 50, { message: 'La categoría debe tener entre 3 y 50 caracteres' })
  category: string;

  @IsOptional()
  @IsString({ message: 'El número de factura debe ser texto' })
  @Length(0, 20, { message: 'El número de factura no debe exceder 20 caracteres' })
  invoiceNumber?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de entrada debe ser una fecha válida' })
  entryDate?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de salida debe ser una fecha válida' })
  exitDate?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de vencimiento debe ser una fecha válida' })
  dueDate?: string;
}
