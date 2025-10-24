import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  ParseUUIDPipe,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join } from 'path';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { UserEntity } from 'src/users/entities/user.entity';

const UPLOADS_DIR = join(__dirname, '../../uploads');

const storage = diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const safeName = `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
    cb(null, safeName);
  },
});

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
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserEntity,
  ) {
    return this.productsService.findOneByUser(id, user.id);
  }

  // Vendedor: crear producto (acepta archivo "image" multipart/form-data o imageUrl en body)
  // Reemplaza el método create en ProductsController por este
  @Roles(Role.User)
  @Post()
  @UseInterceptors(FileInterceptor('image', { storage }))
  async create(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: CreateProductDto,
    @CurrentUser() user: UserEntity,
  ) {
    // construir imageUrl preferido (file > dto.imageUrl)
    const imageUrlFromFile: string | null = file
      ? `/uploads/${file.filename}`
      : null;
    const imageUrlForDb: string | null =
      imageUrlFromFile ??
      (dto.imageUrl !== undefined ? dto.imageUrl || null : null);

    // inyectar imageUrl en dto antes de pasar al service
    (dto as any).imageUrl = imageUrlForDb;

    // delegar la validación y normalización al service
    const created = await this.productsService.createForUser(dto, user.id);
    return created;
  }

  // Reemplaza el método update en ProductsController por este
  @Roles(Role.User)
  @Put(':id')
  @UseInterceptors(FileInterceptor('image', { storage }))
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: UserEntity,
  ) {
    // construir imageUrl preferido (file > dto.imageUrl)
    const imageUrlFromFile: string | null = file
      ? `/uploads/${file.filename}`
      : null;
    const imageUrlField =
      imageUrlFromFile !== null
        ? imageUrlFromFile
        : dto.imageUrl !== undefined
          ? dto.imageUrl
          : undefined;

    if (imageUrlField !== undefined) {
      (dto as any).imageUrl = imageUrlField; // puede ser string | null
    }

    // delegar normalización/validación al service
    return this.productsService.updateForUser(id, dto, user.id);
  }

  // Vendedor: eliminar producto
  @Roles(Role.User)
  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserEntity,
  ) {
    return this.productsService.removeForUser(id, user.id);
  }

  // Público, sin roles ni token
  @Get('public')
  getPublicProducts(@Query('companyId') companyId: string) {
    if (!companyId) {
      throw new BadRequestException('Falta el parámetro companyId');
    }
    return this.productsService.findByCompany(companyId);
  }
}
