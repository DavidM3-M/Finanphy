import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateReminderDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsOptional()
  note?: string;

  @IsDateString()
  remindAt!: string;

  @IsBoolean()
  @IsOptional()
  allDay?: boolean;

  @IsString()
  @IsOptional()
  type?: string;

  @IsUUID()
  @IsOptional()
  companyId?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  incomeId?: number;

  @IsUUID()
  @IsOptional()
  orderId?: string;
}
