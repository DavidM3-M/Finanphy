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
@Roles(Role.User, Role.Admin, Role.Seller)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // Vendedor: ver todos sus productos
  @Roles(Role.User)
  @Get()
  findAll(@CurrentUser() user: UserEntity) {
    return this.productsService.findAllByUser(user.id);
  }

  // Vendedor: ver un producto específico
  @Roles(Role.User)
  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserEntity,
  ) {
    return this.productsService.findOneByUser(id, user.id);
  }

  // Vendedor: crear producto
  @Roles(Role.User)
  @Post()
  create(@Body() dto: CreateProductDto, @CurrentUser() user: UserEntity) {
    return this.productsService.createForUser(dto, user.id);
  }

  // Vendedor: actualizar producto
  @Roles(Role.User)
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: UserEntity,
  ) {
    return this.productsService.updateForUser(id, dto, user.id);
  }

  // Vendedor: eliminar producto
  @Roles(Role.User)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: UserEntity) {
    return this.productsService.removeForUser(id, user.id);
  }
}