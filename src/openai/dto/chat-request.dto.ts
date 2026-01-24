import { IsArray, ArrayMaxSize, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { MessageDto } from './message.dto';

export class ChatRequestDto {
  @IsArray()
  @ArrayMaxSize(12)
  @ValidateNested({ each: true })
  @Type(() => MessageDto)
  messages: MessageDto[];
}
