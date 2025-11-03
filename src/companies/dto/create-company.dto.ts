// src/companies/dto/create-company.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsPhoneNumber,
  IsDateString,
} from 'class-validator';

export class CreateCompanyDto {
  
  @IsString()
  @IsOptional()
  tradeName: string;

  @IsString()
  @IsOptional()
  legalName: string;

  @IsString()
  @IsOptional()
  companyType: string; // e.g., S.A.S., LTDA, S.A.

  @IsString()
  @IsOptional()
  taxId: string;

  @IsString()
  @IsOptional()
  taxRegistry: string;

  @IsString()
  @IsOptional()
  businessPurpose: string;

  // Contact and location
  @IsEmail()
  @IsOptional()
  companyEmail: string;

  @IsPhoneNumber('CO')
  @IsOptional()
  companyPhone: string;

  @IsString()
  @IsOptional()
  fiscalAddress: string;

  @IsString()
  @IsOptional()
  city: string;

  @IsString()
  @IsOptional()
  state: string;

  // Legal representative
  @IsString()
  @IsOptional()
  representativeName: string;

  @IsString()
  @IsOptional()
  representativeDocument: string;

  @IsDateString()
  @IsOptional()
  incorporationDate: string;
}