import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsString,
  IsISO8601,
  IsUUID,
} from 'class-validator';

export class CreateReminderDto {
  @IsString()
  title!: string;

  @IsISO8601()
  remindAt!: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  allDay?: boolean;

  @IsOptional() @IsString() type?: string;

  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : undefined))
  incomeId?: number;

  @IsOptional() @IsString() orderId?: string;

  @IsOptional()
  @IsUUID('4', { message: 'El ID de empresa debe ser un UUID válido' })
  @Transform(({ value }) => (value === null || value === '' ? undefined : value))
  companyId?: string;
}
