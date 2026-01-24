import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class CalendarQueryDto {
  @IsDateString()
  @IsOptional()
  from?: string;

  @IsDateString()
  @IsOptional()
  to?: string;

  @IsUUID()
  @IsOptional()
  companyId?: string;
}
