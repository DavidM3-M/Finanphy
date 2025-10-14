import {
  IsEmail,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateCompanyDto } from '../../companies/dto/create-company.dto';

export class RegisterDto {
  @IsString()
  @MinLength(2)
  firstName: string;

  @IsString()
  @MinLength(2)
  lastName: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(7)
  password: string;

  @ValidateNested()
  @Type(() => CreateCompanyDto)
  company: CreateCompanyDto;
}