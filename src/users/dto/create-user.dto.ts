import { IsEmail, IsString, MinLength, IsUUID } from 'class-validator';
import { Role } from 'src/auth/enums/role.enum';
import { IsEnum, IsOptional } from 'class-validator';

export class CreateUserDto {
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

  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
