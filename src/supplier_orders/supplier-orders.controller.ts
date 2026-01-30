import {
  Controller,
  Post,
  Body,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  Param,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { SupplierOrdersService } from './supplier-orders.service';
import { CreateSupplierOrderDto } from './dto/create-supplier-order.dto';
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
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (
    _req: any,
    file: Express.Multer.File,
    cb: (error: Error | null, acceptFile: boolean) => void,
  ): void => {
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
@Controller('supplier-orders')
export class SupplierOrdersController {
  constructor(private readonly supplierOrdersService: SupplierOrdersService) {}

  @Post()
  create(@Body() dto: CreateSupplierOrderDto, @CurrentUser() user: UserEntity) {
    return this.supplierOrdersService.createForUser(dto, user.id);
  }

  @Post(':id/invoice')
  @UseInterceptors(FileInterceptor('invoice', INVOICE_UPLOAD))
  uploadInvoice(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: UserEntity,
  ) {
    return this.supplierOrdersService.attachInvoice(id, user.id, file);
  }

  @Post(':id/confirm')
  confirm(@Param('id') id: string, @CurrentUser() user: UserEntity) {
    return this.supplierOrdersService.confirmOrder(id, user.id);
  }
}
