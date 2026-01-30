import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Query,
  Param,
  Put,
  Delete,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { UserEntity } from 'src/users/entities/user.entity';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
  create(@Body() dto: CreateSupplierDto, @CurrentUser() user: UserEntity) {
    return this.suppliersService.createForUser(dto, user.id);
  }

  @Get()
  findAll(
    @CurrentUser() user: UserEntity,
    @Query('companyId') companyId?: string,
  ) {
    return this.suppliersService.findAllForUser(user.id, companyId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: UserEntity) {
    return this.suppliersService.findOneForUser(id, user.id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSupplierDto,
    @CurrentUser() user: UserEntity,
  ) {
    return this.suppliersService.updateForUser(id, dto, user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: UserEntity) {
    return this.suppliersService.removeForUser(id, user.id);
  }
}
