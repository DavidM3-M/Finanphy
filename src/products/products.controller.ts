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
import { diskStorage } from 'multer';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Response } from 'express';
import { ProductsService, ImagePayload } from './products.service';
import { CheckStockDto } from './dto/check-stock.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { UserEntity } from 'src/users/entities/user.entity';

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');

const MULTER_DISK = {
  storage: diskStorage({
    destination: UPLOADS_DIR,
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || '';
      cb(null, `${uuidv4()}${ext}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (
    _req: unknown,
    file: Express.Multer.File,
    cb: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    if (!/^image\/(jpeg|png|webp)$/i.test(file.mimetype)) {
      cb(new Error('Tipo de archivo no permitido'), false);
      return;
    }
    cb(null, true);
  },
};

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.User, Role.Admin, Role.Seller)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // Comprobar disponibilidad de stock para varios productos
  @Post('check-stock')
  async checkStock(@Body() dto: CheckStockDto) {
    return this.productsService.checkStock(dto.items ?? []);
  }

  // Lista privada del vendedor
  @Roles(Role.User)
  @Get()
  findAll(
    @CurrentUser() user: UserEntity,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.productsService.findAllByUser(user.id, page, limit);
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
  @UseInterceptors(FileInterceptor('image', MULTER_DISK))
  async create(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: CreateProductDto,
    @CurrentUser() user: UserEntity,
  ) {
    console.log(
      'UPLOAD CREATE -> file present:',
      !!file,
      'orig:',
      file?.originalname,
      'size:',
      file?.size,
      'filename:',
      file?.filename,
    );
    if (file) {
      const filePath = path.resolve(UPLOADS_DIR, file.filename);
      const buf = fs.readFileSync(filePath);
      (
        dto as CreateProductDto & { image?: ImagePayload; imageUrl?: string }
      ).image = {
        buffer: buf,
        filename: file.filename,
        mimetype: file.mimetype,
        size: buf.length,
      };
      (dto as CreateProductDto & { imageUrl?: string }).imageUrl =
        `/uploads/${file.filename}`;
    }

    return this.productsService.createForUser(dto, user.id);
  }

  // Actualizar producto (acepta multipart form-data campo "image")
  @Roles(Role.User)
  @Put(':id')
  @UseInterceptors(FileInterceptor('image', MULTER_DISK))
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: UserEntity,
  ) {
    console.log(
      'UPLOAD UPDATE -> file present:',
      !!file,
      'orig:',
      file?.originalname,
      'size:',
      file?.size,
      'filename:',
      file?.filename,
    );
    if (file) {
      const filePath = path.resolve(UPLOADS_DIR, file.filename);
      const buf = fs.readFileSync(filePath);
      (
        dto as UpdateProductDto & { image?: ImagePayload; imageUrl?: string }
      ).image = {
        buffer: buf,
        filename: file.filename,
        mimetype: file.mimetype,
        size: buf.length,
      };
      (dto as UpdateProductDto & { imageUrl?: string }).imageUrl =
        `/uploads/${file.filename}`;
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
  getPublicProducts(
    @Query('companyId') companyId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('q') q?: string,
    @Query('category') category?: string,
    @Query('expiresBefore') expiresBefore?: string,
    @Query('expiresAfter') expiresAfter?: string,
  ) {
    if (!companyId)
      throw new BadRequestException('Falta el parámetro companyId');
    return this.productsService.findByCompany(companyId, page, limit, {
      q: q ?? undefined,
      category: category ?? undefined,
      expiresBefore: expiresBefore ?? undefined,
      expiresAfter: expiresAfter ?? undefined,
    });
  }

  // Valor total del inventario. Si se pasa `companyId`, devuelve para esa compañía
  // Usuarios normales deben especificar `companyId` (se valida ownership).
  // Admins pueden omitir `companyId` para obtener total global.
  @Get('inventory/total')
  async getInventoryTotal(
    @Query('companyId') companyId: string | undefined,
    @CurrentUser() user: UserEntity,
  ) {
    const isAdmin = user?.role === Role.Admin;
    return this.productsService.getTotalInventoryValue({
      companyId: companyId ?? undefined,
      userId: user?.id,
      isAdmin,
    });
  }

  // Endpoint que devuelve la imagen binaria guardada en BD
  @Get(':id/image')
  async getImage(@Param('id', ParseUUIDPipe) id: string, @Res() res: Response) {
    type ImageResult = {
      data: Buffer;
      mimetype?: string;
      size?: number;
    } | null;
    const r: ImageResult = await this.productsService.getImageByProductId(id);
    if (!r || !r.data) {
      return res
        .status(HttpStatus.NOT_FOUND)
        .json({ message: 'Image not found' });
    }
    res.setHeader('Content-Type', r.mimetype || 'application/octet-stream');
    res.setHeader('Content-Length', String(r.size ?? r.data.length));
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.send(r.data);
  }

  // DELETE /products/:id/image  -> borra campos de imagen en la BD y fichero en disco si existe
  @Roles(Role.User)
  @Delete(':id/image')
  async deleteImage(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserEntity,
  ) {
    const prod = await this.productsService.deleteImageForUser(id, user.id);
    // eliminar fichero físico si existe y filename estaba presente
    if (prod?.image_filename) {
      const fileOnDisk = path.resolve(UPLOADS_DIR, prod.image_filename);
      try {
        if (fs.existsSync(fileOnDisk)) fs.unlinkSync(fileOnDisk);
      } catch (err) {
        console.warn('Failed to unlink image file', err);
      }
    }
    return prod;
  }
}
