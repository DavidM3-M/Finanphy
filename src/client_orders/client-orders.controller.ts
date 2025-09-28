import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ClientOrdersService } from './client-orders.service';
import { CreateClientOrderDto } from './dto/create-client-order.dto';
import { UpdateClientOrderStatusDto } from './dto/update-client-order-status.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { UserEntity } from 'src/users/entities/user.entity';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('client-orders')
export class ClientOrdersController {
  constructor(private readonly clientOrdersService: ClientOrdersService) {}

  // Cliente crea orden hacia una compañía
  @Roles(Role.Client)
  @Post()
  create(
    @Body() dto: CreateClientOrderDto,
    @CurrentUser() user: UserEntity,
  ) {
    return this.clientOrdersService.create(dto.companyId, dto.items);
  }

  // Cliente ve órdenes que hizo hacia una compañía
  @Roles(Role.Client)
  @Get('company/:companyId')
  findByCompany(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @CurrentUser() user: UserEntity,
  ) {
    return this.clientOrdersService.getByCompany(companyId);
  }

  // Vendedor ve todas las órdenes
  @Roles(Role.Seller)
  @Get()
  findAll(@CurrentUser() user: UserEntity) {
    return this.clientOrdersService.getAll();
  }

  // Vendedor actualiza estado de una orden
  @Roles(Role.Seller)
  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateClientOrderStatusDto,
  ) {
    return this.clientOrdersService.updateStatus(id, dto.status);
  }

  // Vendedor confirma una orden (valida stock, agrupa ítems, calcula total)
  @Roles(Role.Seller)
  @Post(':id/confirm')
  confirmOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserEntity,
  ) {
    return this.clientOrdersService.confirmOrder(id);
  }
}