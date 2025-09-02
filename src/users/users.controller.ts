import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { UserEntity } from './entities/user.entity';

@UseGuards(AuthGuard('jwt')) 
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(Role.Admin) // Solo admins pueden crear usuarios
  @UseGuards(RolesGuard)
  async create(@Body() dto: CreateUserDto): Promise<UserEntity> {
    return this.usersService.create(dto);
  }

  @Get()
  @Roles(Role.Admin) // Solo admins pueden ver todos los usuarios
  @UseGuards(RolesGuard)
  async findAll(): Promise<UserEntity[]> {
    return this.usersService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<UserEntity | null> {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserEntity> {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.Admin) // Solo admins pueden eliminar usuarios
  @UseGuards(RolesGuard)
  async remove(@Param('id') id: string): Promise<void> {
    return this.usersService.remove(id);
  }

  @Get('admin/only')
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  getAdminStuff(): string {
    return 'Solo admins pueden ver esto';
  }
}