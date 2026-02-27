import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  ParseUUIDPipe,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { UserEntity } from 'src/users/entities/user.entity';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CreateCustomerPaymentDto } from './dto/create-customer-payment.dto';
import { CustomerPaymentsService } from './customer-payments.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.User)
@Controller('customers')
export class CustomersController {
  constructor(
    private readonly customersService: CustomersService,
    private readonly customerPaymentsService: CustomerPaymentsService,
  ) {}

  // list payments for a customer
  @Get(':id/payments')
  payments(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserEntity,
  ) {
    // lazy require to avoid circular deps in some builds
    return (this as any).customerPaymentsService
      ? (this as any).customerPaymentsService.listForUser(id, user.id)
      : null;
  }

  @Get(':id/debt-summary')
  debtSummary(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserEntity,
  ) {
    return this.customersService.debtSummaryForUser(id, user.id);
  }

  @Post(':id/payments')
  @UseInterceptors(FileInterceptor('evidence', {
    storage: diskStorage({
      destination: UPLOADS_DIR,
      filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname) || '';
        cb(null, `${uuidv4()}${ext}`);
      },
    }),
    limits: { fileSize: 15 * 1024 * 1024 },
  }))
  createPayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: any,
    @CurrentUser() user: UserEntity,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    // Coerce amount from string -> number when multipart/form-data was used
    const raw: any = dto;
    const amountRaw = raw.amount;
    const amount = typeof amountRaw === 'string' ? Number(amountRaw) : amountRaw;
    if (!Number.isFinite(amount) || amount < 0.01) throw new BadRequestException('amount inválido');
    const payload: any = {
      amount,
      paidAt: raw.paidAt,
      paymentMethod: raw.paymentMethod,
      note: raw.note,
      orderId: raw.orderId,
    };
    return (this as any).customerPaymentsService.createForUser(id, user.id, payload, file);
  }

  @Get()
  findAll(
    @CurrentUser() user: UserEntity,
    @Query('companyId') companyId?: string,
  ) {
    return this.customersService.findAllForUser(user.id, companyId);
  }

  @Post()
  create(@Body() dto: CreateCustomerDto, @CurrentUser() user: UserEntity) {
    return this.customersService.createForUser(dto, user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: UserEntity) {
    return this.customersService.findOneForUser(id, user.id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
    @CurrentUser() user: UserEntity,
  ) {
    return this.customersService.updateForUser(id, dto, user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: UserEntity) {
    return this.customersService.removeForUser(id, user.id);
  }
}
