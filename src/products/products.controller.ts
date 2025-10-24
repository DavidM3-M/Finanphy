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
  @Roles(Role.User)
  @Post()
  @UseInterceptors(FileInterceptor('image', { storage }))
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateProductDto,
    @CurrentUser() user: UserEntity,
  ) {
    // Construir imageUrl: si se subió archivo, usar /uploads/<filename>; si viene imageUrl en body, puede ser string o null
    const imageUrlFromFile: string | null = file ? `/uploads/${file.filename}` : null;
    // Si file presente, preferir file. Si no, tomar lo que venga en dto.imageUrl (puede ser string | null | undefined)
    const imageUrlForDb: string | null =
      imageUrlFromFile ?? (dto.imageUrl !== undefined ? dto.imageUrl : null);

    // Normalizar/transformar valores numéricos desde strings (DTOs pueden venir como strings)
    const payload = {
      name: dto.name,
      sku: dto.sku,
      description: dto.description ?? null,
      category: dto.category ?? null,
      imageUrl: imageUrlForDb,
      // Convertir a número si vienen como string; si no vienen, dejar undefined so service can handle defaults
      price: (dto as any).price !== undefined ? parseFloat((dto as any).price) : undefined,
      cost: (dto as any).cost !== undefined ? parseFloat((dto as any).cost) : undefined,
      stock: (dto as any).stock !== undefined ? parseInt((dto as any).stock, 10) : undefined,
      // companyId handled by service (using user.id) — no trust of client-provided companyId
    };

    return this.productsService.createForUser(payload as any, user.id);
  }

  // Vendedor: actualizar producto (acepta archivo "image" multipart/form-data or imageUrl in body)
  @Roles(Role.User)
  @Put(':id')
  @UseInterceptors(FileInterceptor('image', { storage }))
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: UserEntity,
  ) {
    // Si hay archivo nuevo, usamos su URL; si no, respetamos el valor que venga en dto.imageUrl (string | null | undefined)
    const imageUrlFromFile: string | null = file ? `/uploads/${file.filename}` : null;
    const imageUrlField =
      imageUrlFromFile !== null
        ? imageUrlFromFile
        : dto.imageUrl !== undefined
        ? dto.imageUrl // puede ser string o null
        : undefined; // undefined => no tocar el campo en la actualización

    const payload: any = {
      // solo incluir campos que vienen en el DTO para evitar sobreescrituras indeseadas
    };

    if (dto.name !== undefined) payload.name = dto.name;
    if (dto.sku !== undefined) payload.sku = dto.sku;
    if (dto.description !== undefined) payload.description = dto.description ?? null;
    if (dto.category !== undefined) payload.category = dto.category ?? null;
    if (imageUrlField !== undefined) payload.imageUrl = imageUrlField; // string | null
    if ((dto as any).price !== undefined) payload.price = parseFloat((dto as any).price);
    if ((dto as any).cost !== undefined) payload.cost = parseFloat((dto as any).cost);
    if ((dto as any).stock !== undefined) payload.stock = parseInt((dto as any).stock, 10);

    return this.productsService.updateForUser(id, payload, user.id);
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