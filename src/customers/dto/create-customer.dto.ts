import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsNumberString,
} from 'class-validator';

export class CreateCustomerDto {
  @IsUUID()
  companyId!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  documentId?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsOptional()
  @IsNumberString()
  debt?: string;

  @IsOptional()
  @IsNumberString()
  credit?: string;
}
