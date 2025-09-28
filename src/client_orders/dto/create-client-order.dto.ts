import { IsArray, ValidateNested, IsUUID, Min, IsInt } from 'class-validator';
import { Transform, Type } from 'class-transformer';

class OrderItemDto {
  
  @Transform(({ value }) => String(value))
  @IsUUID()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateClientOrderDto {
  @IsUUID()
  companyId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}