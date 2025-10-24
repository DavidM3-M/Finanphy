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
  Res,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Response } from 'express';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { UserEntity } from 'src/users/entities/user.entity';

const MULTER_MEMORY = { storage: memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }; // 10MB

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.User, Role.Admin, Role.Seller)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // Lista privada del vendedor
  @Roles(Role.User)
  @Get()
  findAll(@CurrentUser() user: UserEntity) {
    return this.productsService.findAllByUser(user.id);
  }

  // Obtener producto privado
  @Roles(Role.User)
  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserEntity,
  ) {
    return this.productsService.findOneByUser(id, user.id);
  }

  // Crear producto (acepta multipart form-data campo "image")
  @Roles(Role.User)
  @Post()
  @UseInterceptors(FileInterceptor('image', MULTER_MEMORY))
  async create(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: CreateProductDto,
    @CurrentUser() user: UserEntity,
  ) {
    if (file) {
      (dto as any).image = {
        buffer: file.buffer,
        filename: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      };
    }

    return this.productsService.createForUser(dto, user.id);
  }

  // Actualizar producto (acepta multipart form-data campo "image")
  @Roles(Role.User)
  @Put(':id')
  @UseInterceptors(FileInterceptor('image', MULTER_MEMORY))
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: UserEntity,
  ) {
    if (file) {
      (dto as any).image = {
        buffer: file.buffer,
        filename: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      };
    }

    return this.productsService.updateForUser(id, dto, user.id);
  }

  // Eliminar producto
  @Roles(Role.User)
  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserEntity,
  ) {
    return this.productsService.removeForUser(id, user.id);
  }

  // Endpoint público para catálogo (sin token)
  @Get('public')
  getPublicProducts(@Query('companyId') companyId: string) {
    if (!companyId) throw new BadRequestException('Falta el parámetro companyId');
    return this.productsService.findByCompany(companyId);
  }

  // Endpoint que devuelve la imagen binaria guardada en BD
  @Get(':id/image')
  async getImage(@Param('id', ParseUUIDPipe) id: string, @Res() res: Response) {
    const r = await (this.productsService as any).getImageByProductId(id);
    if (!r || !r.data) {
      return res.status(HttpStatus.NOT_FOUND).json({ message: 'Image not found' });
    }
    res.setHeader('Content-Type', r.mimetype || 'application/octet-stream');
    res.setHeader('Content-Length', String(r.size ?? r.data.length));
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.send(r.data);
  }
}