import { IsNumber, Min, IsOptional, IsDateString, IsString, IsUUID } from 'class-validator';

export class CreateCustomerPaymentDto {
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsOptional()
  @IsDateString()
  paidAt?: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsUUID()
  orderId?: string;
}
