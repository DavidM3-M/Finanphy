import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
  Delete,
  UseInterceptors,
  UploadedFile,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ClientOrdersService } from './client-orders.service';
import { CreateClientOrderDto } from './dto/create-client-order.dto';
import { UpdateClientOrderStatusDto } from './dto/update-client-order-status.dto';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { UserEntity } from 'src/users/entities/user.entity';

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');

const INVOICE_UPLOAD = {
  storage: diskStorage({
    destination: UPLOADS_DIR,
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || '';
      cb(null, `${uuidv4()}${ext}`);
    },
  }),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
  fileFilter: (
    _req: any,
    file: Express.Multer.File,
    cb: (err: Error | null, acceptFile: boolean) => void,
  ) => {
    const allowed =
      /^application\/pdf$/i.test(file.mimetype) ||
      /^image\/(jpeg|png|webp)$/i.test(file.mimetype);
    if (!allowed) {
      cb(new Error('Tipo de archivo no permitido'), false);
      return;
    }
    cb(null, true);
  },
};

@UseGuards(AuthGuard('jwt'))
@Controller('client-orders')
export class ClientOrdersController {
  constructor(private readonly clientOrdersService: ClientOrdersService) {}

  // Usuario crea orden hacia una compañía
  @Post()
  create(@Body() dto: CreateClientOrderDto, @CurrentUser() user: UserEntity) {
    return this.clientOrdersService.create(
      dto.companyId,
      dto.items,
      user.id, // ← aquí
      dto.customerId,
    );
  }

  // Usuario ve órdenes de una compañía (solo propias o de la empresa)
  @Get('company/:companyId')
  findByCompany(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @CurrentUser() user: UserEntity,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.clientOrdersService.getByCompany(
      companyId,
      user.id,
      page,
      limit,
    );
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
  findAll(
    @CurrentUser() user: UserEntity,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.clientOrdersService.getAll(user.id, page, limit);
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

  // Subir factura (PDF o imagen)
  @Post(':id/invoice')
  @UseInterceptors(FileInterceptor('invoice', INVOICE_UPLOAD))
  uploadInvoice(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: UserEntity,
  ) {
    return this.clientOrdersService.attachInvoice(id, user.id, file);
  }

  // Eliminar factura adjunta
  @Delete(':id/invoice')
  removeInvoice(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserEntity,
  ) {
    return this.clientOrdersService.removeInvoice(id, user.id);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @CurrentUser() user: UserEntity) {
    return this.clientOrdersService.deleteOrder(id, user.id);
  }
}
