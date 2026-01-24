import {
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateReminderDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  note?: string;

  @IsDateString()
  @IsOptional()
  remindAt?: string;

  @IsBoolean()
  @IsOptional()
  allDay?: boolean;

  @IsString()
  @IsOptional()
  type?: string;

  @IsUUID()
  @IsOptional()
  companyId?: string | null;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  incomeId?: number | null;

  @IsUUID()
  @IsOptional()
  orderId?: string | null;
}
