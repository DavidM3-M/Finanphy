// src/finance/incomes.controller.ts
import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  ParseIntPipe,
  Put,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { IncomesService } from '../services/incomes.service';
import { CreateIncomeDto } from '../dto/create-income.dto';
import { UpdateIncomeDto } from '../dto/update-income.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { UserEntity } from 'src/users/entities/user.entity';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.User)
@Controller('incomes')
export class IncomesController {
  constructor(private readonly incomesService: IncomesService) {}

  @Get()
  findAll(
    @CurrentUser() user: UserEntity,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.incomesService.findAllByUser(user.id, page, limit);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserEntity,
  ) {
    return this.incomesService.findOneByUser(id, user.id);
  }

  @Post()
  create(@Body() dto: CreateIncomeDto, @CurrentUser() user: UserEntity) {
    return this.incomesService.createForUser(dto, user.id);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateIncomeDto,
    @CurrentUser() user: UserEntity,
  ) {
    return this.incomesService.updateForUser(id, dto, user.id);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserEntity,
  ) {
    return this.incomesService.removeForUser(id, user.id);
  }
}
