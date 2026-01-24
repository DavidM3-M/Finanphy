import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { UserEntity } from 'src/users/entities/user.entity';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.User)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  findAll(
    @CurrentUser() user: UserEntity,
    @Query('companyId') companyId?: string,
  ) {
    return this.customersService.findAllForUser(user.id, companyId);
  }

  @Post()
  create(@Body() dto: CreateCustomerDto, @CurrentUser() user: UserEntity) {
    return this.customersService.createForUser(dto, user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: UserEntity) {
    return this.customersService.findOneForUser(id, user.id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
    @CurrentUser() user: UserEntity,
  ) {
    return this.customersService.updateForUser(id, dto, user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: UserEntity) {
    return this.customersService.removeForUser(id, user.id);
  }
}
