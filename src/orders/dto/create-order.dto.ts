import { IsString, IsNumber, IsDateString, IsNotEmpty, Min, MaxLength, IsOptional, IsIn } from 'class-validator';

export class CreateOrderDto {
    @IsNotEmpty({ message: 'El nombre del cliente es obligatorio' })
    @IsString({ message: 'El nombre del cliente debe ser un texto' })
    @MaxLength(255, { message: 'El nombre no puede exceder 255 caracteres' })
    customerName: string;

    @IsNotEmpty({ message: 'El producto es obligatorio' })
    @IsString({ message: 'El producto debe ser un texto' })
    @MaxLength(255, { message: 'El producto no puede exceder 255 caracteres' })
    product: string;

    @IsNotEmpty({ message: 'El monto es obligatorio' })
    @IsNumber({}, { message: 'El monto debe ser un número' })
    @Min(0.01, { message: 'El monto debe ser mayor a 0' })
    amount: number;

    @IsOptional()
    @IsNumber({}, { message: 'La cantidad debe ser un número' })
    @Min(1, { message: 'La cantidad debe ser al menos 1' })
    quantity?: number;

    @IsOptional()
    @IsString({ message: 'El estado debe ser un texto' })
    @IsIn(['pending', 'completed', 'cancelled'], { message: 'El estado debe ser: pending, completed o cancelled' })
    status?: string;

    @IsNotEmpty({ message: 'La fecha del pedido es obligatoria' })
    @IsDateString({}, { message: 'La fecha debe tener un formato válido' })
    orderDate: Date;

    @IsOptional()
    @IsDateString({}, { message: 'La fecha de entrega debe tener un formato válido' })
    deliveryDate?: Date;
}
