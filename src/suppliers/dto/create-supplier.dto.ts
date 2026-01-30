import { IsString, IsOptional, IsUUID, IsEmail } from 'class-validator';

export class CreateSupplierDto {
  @IsUUID('4')
  companyId!: string;

  @IsString()
  name!: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  contact?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
