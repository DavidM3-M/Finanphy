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
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { UserEntity } from 'src/users/entities/user.entity';

@UseGuards(AuthGuard('jwt'))
@Controller('client-orders')
export class ClientOrdersController {
  constructor(private readonly clientOrdersService: ClientOrdersService) {}

  // Usuario crea orden hacia una compañía
    @Post()
  create(
    @Body() dto: CreateClientOrderDto,
    @CurrentUser() user: UserEntity,
  ) {
    return this.clientOrdersService.create(
      dto.companyId,
      dto.items,
      user.id,             // ← aquí
    );
  }

  // Usuario ve órdenes de una compañía (solo propias o de la empresa)
  @Get('company/:companyId')
  findByCompany(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @CurrentUser() user: UserEntity,
  ) {
    return this.clientOrdersService.getByCompany(companyId, user.id);
  }

  // Usuario ve una orden por ID (sólo propio o de la empresa)
  @Get(':id')
  findById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserEntity,
  ) {
    return this.clientOrdersService.getById(id, user.id);
  }

  // Usuario ve todas sus órdenes o las de su empresa
  @Get()
  findAll(@CurrentUser() user: UserEntity) {
    return this.clientOrdersService.getAll(user.id);
  }

  // Usuario actualiza estado de una orden
  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateClientOrderStatusDto,
  ) {
    return this.clientOrdersService.updateStatus(id, dto.status);
  }

  // Usuario confirma una orden (valida stock, agrupa ítems, calcula total)
  @Post(':id/confirm')
  confirmOrder(@Param('id', ParseUUIDPipe) id: string) {
    return this.clientOrdersService.confirmOrder(id);
  }
}