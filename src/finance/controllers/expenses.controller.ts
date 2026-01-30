import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  ParseIntPipe,
  Put,
  Delete,
  UseGuards,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ExpensesService } from '../services/expenses.service';
import { CreateExpenseDto } from '../dto/create-expense.dto';
import { UpdateExpenseDto } from '../dto/update-expense.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { AuthGuard } from 'src/auth/guards/auth.guard'; // ✅ tu guardia personalizado
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
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

@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.User)
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  findAll(
    @CurrentUser() user: UserEntity,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.expensesService.findAllByUser(user.id, page, limit);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserEntity,
  ) {
    return this.expensesService.findOneByUser(id, user.id);
  }

  @Post()
  create(@Body() dto: CreateExpenseDto, @CurrentUser() user: UserEntity) {
    return this.expensesService.createForUser(dto, user.id);
  }

  

  @Post(':id/invoice')
  @UseInterceptors(FileInterceptor('invoice', INVOICE_UPLOAD))
  uploadInvoice(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: UserEntity,
  ) {
    return this.expensesService.attachInvoice(id, user.id, file);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateExpenseDto,
    @CurrentUser() user: UserEntity,
  ) {
    return this.expensesService.updateForUser(id, dto, user.id);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserEntity,
  ) {
    return this.expensesService.removeForUser(id, user.id);
  }
}
