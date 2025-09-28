import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { UserEntity } from 'src/users/entities/user.entity';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // Cliente: ver catálogo público de una compañía
  @Roles(Role.Client)
  @Get('company/:companyId')
  findByCompany(@Param('companyId', ParseUUIDPipe) companyId: string) {
    return this.productsService.findAllByCompany(companyId);
  }

  // Vendedor: ver todos sus productos
  @Roles(Role.Seller)
  @Get()
  findAll(@CurrentUser() user: UserEntity) {
    return this.productsService.findAllByUser(user.id);
  }

  // Vendedor: ver un producto específico
  @Roles(Role.Seller)
  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserEntity,
  ) {
    return this.productsService.findOneByUser(id, user.id);
  }

  // Vendedor: crear producto
  @Roles(Role.Seller)
  @Post()
  create(@Body() dto: CreateProductDto, @CurrentUser() user: UserEntity) {
    return this.productsService.createForUser(dto, user.id);
  }

  // Vendedor: actualizar producto
  @Roles(Role.Seller)
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: UserEntity,
  ) {
    return this.productsService.updateForUser(id, dto, user.id);
  }

  // Vendedor: eliminar producto
  @Roles(Role.Seller)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: UserEntity) {
    return this.productsService.removeForUser(id, user.id);
  }
}