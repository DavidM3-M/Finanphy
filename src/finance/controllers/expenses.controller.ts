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
} from '@nestjs/common';
import { ExpensesService } from '../services/expenses.service';
import { CreateExpenseDto } from '../dto/create-expense.dto';
import { UpdateExpenseDto } from '../dto/update-expense.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { AuthGuard } from 'src/auth/guards/auth.guard'; // ✅ tu guardia personalizado
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { UserEntity } from 'src/users/entities/user.entity';

@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.User)
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  findAll(@CurrentUser() user: UserEntity) {
    return this.expensesService.findAllByUser(user.id);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserEntity,
  ) {
    return this.expensesService.findOneByUser(id, user.id);
  }

  @Post()
  create(@Body() dto: CreateExpenseDto, @CurrentUser() user: UserEntity) {
    return this.expensesService.createForUser(dto, user.id);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateExpenseDto,
    @CurrentUser() user: UserEntity,
  ) {
    return this.expensesService.updateForUser(id, dto, user.id);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserEntity,
  ) {
    return this.expensesService.removeForUser(id, user.id);
  }
}
