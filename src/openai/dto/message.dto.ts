import { IsString } from 'class-validator';

export class MessageDto {
  @IsString()
  role: string;

  @IsString()
  content: string;
}