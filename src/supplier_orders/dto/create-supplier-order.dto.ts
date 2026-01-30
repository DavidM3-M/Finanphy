import {
  IsUUID,
  IsArray,
  ValidateNested,
  IsOptional,
  Min,
  IsInt,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

class OrderItemDto {
  @Transform(({ value }) => String(value))
  @IsUUID()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateSupplierOrderDto {
  @IsUUID()
  supplierId!: string;

  @IsUUID()
  @IsOptional()
  companyId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];

  @IsOptional()
  description?: string;
}
