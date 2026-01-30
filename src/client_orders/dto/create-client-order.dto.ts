import {
  IsArray,
  ValidateNested,
  IsUUID,
  Min,
  IsInt,
  IsOptional,
} from 'class-validator';
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

  @IsUUID()
  @IsOptional()
  customerId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsOptional()
  description?: string;
}
