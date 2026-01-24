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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { UserEntity } from 'src/users/entities/user.entity';
import { RemindersService } from './reminders.service';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { UpdateReminderDto } from './dto/update-reminder.dto';

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');

const REMINDER_UPLOAD = {
  storage: diskStorage({
    destination: UPLOADS_DIR,
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || '';
      cb(null, `${uuidv4()}${ext}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (
    _req: any,
    file: Express.Multer.File,
    cb: (err: Error | null, acceptFile: boolean) => void,
  ) => {
    const allowed =
      /^image\/(jpeg|png|webp)$/i.test(file.mimetype) ||
      /^application\/pdf$/i.test(file.mimetype);
    if (!allowed) {
      cb(new Error('Tipo de archivo no permitido'), false);
      return;
    }
    cb(null, true);
  },
};

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.User)
@Controller('reminders')
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Get()
  findAll(
    @CurrentUser() user: UserEntity,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('companyId') companyId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.remindersService.findByRangeForUser(
      user.id,
      from,
      to,
      companyId,
      page,
      limit,
    );
  }

  @Post()
  @UseInterceptors(FileInterceptor('attachment', REMINDER_UPLOAD))
  create(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: CreateReminderDto,
    @CurrentUser() user: UserEntity,
  ) {
    return this.remindersService.createForUser(dto, user.id, file);
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('attachment', REMINDER_UPLOAD))
  update(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: UpdateReminderDto,
    @CurrentUser() user: UserEntity,
  ) {
    return this.remindersService.updateForUser(id, dto, user.id, file);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: UserEntity) {
    return this.remindersService.removeForUser(id, user.id);
  }
}
