import {
  IsArray,
  IsNotEmpty,
  IsString,
  ValidateNested,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CheckStockItemDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsNumber()
  @Min(0)
  quantity: number;
}

export class CheckStockDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CheckStockItemDto)
  items: CheckStockItemDto[];
}
