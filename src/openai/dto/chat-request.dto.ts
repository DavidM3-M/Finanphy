import { IsArray, ArrayMaxSize, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class MessageDto {
  role: string;
  content: string;
}

export class ChatRequestDto {
  @IsArray()
  @ArrayMaxSize(12)
  @ValidateNested({ each: true })
  @Type(() => MessageDto)
  messages: MessageDto[];
}