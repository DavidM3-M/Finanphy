import {
  IsString,
  IsNumberString,
  IsOptional,
  MinLength,
  MaxLength,
  Length,
  IsUUID,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @Length(3, 100)
  name: string;

  @IsString()
  @Length(3, 50)
  sku: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsNumberString()
  price: string;

  @IsNumberString()
  cost: string;

  @IsOptional()
  @IsNumberString()
  stock?: string;

  @IsOptional()
  @IsUUID('4')
  companyId?: string;
}