// src/products/dto/create-product.dto.ts
import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsString() // SKU (Stock Keeping Unit): Es un código único que usamos en la empresa para identificar el producto.
  sku: string;

  @IsNumber()
  price: number;

  @IsNumber()
  cost: number;

  @IsOptional()
  @IsNumber()
  stock?: number;
}
