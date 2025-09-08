import { IsString, IsNumber, IsDateString, IsNotEmpty, Min, MaxLength } from 'class-validator';
export class CreateExpenseDto {
    @IsNotEmpty({ message: 'La descripción es obligatoria' })
  @IsString({ message: 'La descripción debe ser un texto' })
  @MaxLength(255, { message: 'La descripción no puede exceder 255 caracteres' })
  description: string;

  @IsNotEmpty({ message: 'El monto es obligatorio' })
  @IsNumber({}, { message: 'El monto debe ser un número' })
  @Min(0.01, { message: 'El monto debe ser mayor a 0' })
  amount: number; // En COP

  @IsNotEmpty({ message: 'La categoría es obligatoria' })
  @IsString({ message: 'La categoría debe ser un texto' })
  @MaxLength(100, { message: 'La categoría no puede exceder 100 caracteres' })
  category: string;

  @IsNotEmpty({ message: 'La fecha es obligatoria' })
  @IsDateString({}, { message: 'La fecha debe tener un formato válido' })
  date: Date;
}
