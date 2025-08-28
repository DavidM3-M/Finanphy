import { IsNumber,Min, IsString,IsOptional, IsDateString} from "class-validator";

export class CreateInvestmentDto {
    @IsNumber()
    @Min(0.01, { message: 'La inversión debe ser mayor a 0' })
    amount: number;


    @IsString()
    category: string;


    @IsOptional()
    @IsString()
    invoicenumber?: string;

    @IsOptional()
    @IsDateString({},{ message: 'La fecha de entrada debe ser una fecha válida' })
    entryDate?: string;

    @IsOptional()
    @IsDateString({},{ message: 'La fecha de salida debe ser una fecha válida' })
    exitDate?: string;

    @IsOptional()
    @IsDateString({},{ message: 'La fecha de vencimiento debe ser una fecha válida' })
    dueDate?: string;
}
