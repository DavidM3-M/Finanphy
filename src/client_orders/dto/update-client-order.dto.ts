import { IsArray, ValidateNested, IsUUID, Min, IsInt, IsOptional } from 'class-validator';
import { Transform, Type } from 'class-transformer';

class OrderItemDto {
  @Transform(({ value }) => String(value))
  @IsUUID()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class UpdateClientOrderDto {
  @IsUUID()
  @IsOptional()
  customerId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  @IsOptional()
  items?: OrderItemDto[];

  @IsOptional()
  description?: string;

  @IsOptional()
  paymentMethod?: string;
}
