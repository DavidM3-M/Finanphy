import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reminder } from './entities/reminder.entity';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { UpdateReminderDto } from './dto/update-reminder.dto';
import { Company } from 'src/companies/entities/company.entity';
import { validateCompanyOwnership } from 'src/common/helpers/validateCompanyOwnership';
import { Income } from 'src/finance/entities/income.entity';
import { ClientOrder } from 'src/client_orders/entities/client-order.entity';

@Injectable()
export class RemindersService {
  constructor(
    @InjectRepository(Reminder)
    private readonly remindersRepo: Repository<Reminder>,

    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,

    @InjectRepository(Income)
    private readonly incomeRepo: Repository<Income>,

    @InjectRepository(ClientOrder)
    private readonly orderRepo: Repository<ClientOrder>,
  ) {}

  private parseDateInput(v?: string): Date | null {
    if (!v) return null;
    // date-only YYYY-MM-DD -> start of day UTC
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
      return new Date(`${v}T00:00:00.000Z`);
    }
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }

  private applyAttachment(reminder: Reminder, file?: Express.Multer.File) {
    if (!file) return;
    reminder.attachmentFilename = file.filename ?? null;
    reminder.attachmentMime = file.mimetype ?? null;
    reminder.attachmentSize = file.size ?? null;
    reminder.attachmentUploadedAt = new Date();
    reminder.attachmentUrl = `/uploads/${file.filename}`;
  }

  async createForUser(
    dto: CreateReminderDto,
    userId: string,
    file?: Express.Multer.File,
  ) {
    const remindAtParsed = this.parseDateInput(dto.remindAt);
    if (!remindAtParsed) {
      throw new BadRequestException('remindAt inválido');
    }

    let companyId: string | undefined;
    if (dto.companyId) {
      const company = await validateCompanyOwnership(
        this.companyRepo,
        dto.companyId,
        userId,
      );
      companyId = company.id;
    }

    let incomeId: number | null = null;
    if (dto.incomeId !== undefined && dto.incomeId !== null) {
      const incomeIdValue = Number(dto.incomeId);
      if (!Number.isInteger(incomeIdValue) || incomeIdValue <= 0) {
        throw new BadRequestException('incomeId inválido');
      }
      const income = await this.incomeRepo.findOne({
        where: { id: incomeIdValue },
        relations: ['company'],
      });
      if (!income || !income.company) {
        throw new NotFoundException('Ingreso no encontrado');
      }
      if (income.company.userId !== userId) {
        throw new ForbiddenException('No tienes acceso a este ingreso');
      }
      incomeId = income.id;
      companyId = companyId ?? income.companyId;
    }

    let orderId: string | null = null;
    if (dto.orderId) {
      const orderIdValue = String(dto.orderId);
      const order = await this.orderRepo.findOne({
        where: { id: orderIdValue },
        relations: ['company', 'user'],
      });
      if (!order) throw new NotFoundException('Pedido no encontrado');
      const isCreator = order.userId === userId;
      const isReceiver = order.company.userId === userId;
      if (!isCreator && !isReceiver) {
        throw new ForbiddenException('No tienes acceso a esta orden');
      }
      orderId = order.id;
      companyId = companyId ?? order.company?.id ?? null;
    }

    const reminder = this.remindersRepo.create({
      title: dto.title,
      note: dto.note,
      remindAt: remindAtParsed,
      allDay: dto.allDay ?? false,
      type: dto.type,
      userId,
      companyId: companyId ?? null,
      incomeId,
      orderId,
    });

    this.applyAttachment(reminder, file);

    return this.remindersRepo.save(reminder);
  }

  async findByRangeForUser(
    userId: string,
    from?: string,
    to?: string,
    companyId?: string,
  ) {
    const fromDate = this.parseDateInput(from);
    const toDate = this.parseDateInput(to);

    const qb = this.remindersRepo
      .createQueryBuilder('reminder')
      .where('reminder.userId = :userId', { userId });

    if (companyId) {
      qb.andWhere('reminder.companyId = :companyId', { companyId });
    }

    if (fromDate && toDate) {
      qb.andWhere('reminder.remindAt BETWEEN :from AND :to', {
        from: fromDate,
        to: toDate,
      });
    } else if (fromDate) {
      qb.andWhere('reminder.remindAt >= :from', { from: fromDate });
    } else if (toDate) {
      qb.andWhere('reminder.remindAt <= :to', { to: toDate });
    }

    return qb.orderBy('reminder.remindAt', 'ASC').getMany();
  }

  async findOneForUser(id: string, userId: string) {
    const reminder = await this.remindersRepo.findOne({
      where: { id },
    });

    if (!reminder) throw new NotFoundException('Recordatorio no encontrado');
    if (reminder.userId !== userId) {
      throw new ForbiddenException('No tienes acceso a este recordatorio');
    }

    return reminder;
  }

  async updateForUser(
    id: string,
    dto: UpdateReminderDto,
    userId: string,
    file?: Express.Multer.File,
  ) {
    const reminder = await this.findOneForUser(id, userId);

    if (dto.companyId !== undefined) {
      if (dto.companyId === null) {
        reminder.companyId = null;
      } else {
        const company = await validateCompanyOwnership(
          this.companyRepo,
          dto.companyId,
          userId,
        );
        reminder.companyId = company.id;
      }
    }

    if (dto.incomeId !== undefined) {
      if (dto.incomeId === null) {
        reminder.incomeId = null;
      } else {
        const incomeIdValue = Number(dto.incomeId);
        if (!Number.isInteger(incomeIdValue) || incomeIdValue <= 0) {
          throw new BadRequestException('incomeId inválido');
        }
        const income = await this.incomeRepo.findOne({
          where: { id: incomeIdValue },
          relations: ['company'],
        });
        if (!income || !income.company) {
          throw new NotFoundException('Ingreso no encontrado');
        }
        if (income.company.userId !== userId) {
          throw new ForbiddenException('No tienes acceso a este ingreso');
        }
        reminder.incomeId = income.id;
        reminder.companyId = reminder.companyId ?? income.companyId;
      }
    }

    if (dto.orderId !== undefined) {
      if (dto.orderId === null) {
        reminder.orderId = null;
      } else {
        const orderIdValue = String(dto.orderId);
        const order = await this.orderRepo.findOne({
          where: { id: orderIdValue },
          relations: ['company', 'user'],
        });
        if (!order) throw new NotFoundException('Pedido no encontrado');
        const isCreator = order.userId === userId;
        const isReceiver = order.company.userId === userId;
        if (!isCreator && !isReceiver) {
          throw new ForbiddenException('No tienes acceso a esta orden');
        }
        reminder.orderId = order.id;
        reminder.companyId = reminder.companyId ?? order.company?.id ?? null;
      }
    }

    if (dto.remindAt !== undefined) {
      const parsed = this.parseDateInput(dto.remindAt);
      if (!parsed) throw new BadRequestException('remindAt inválido');
      reminder.remindAt = parsed;
    }

    reminder.title = dto.title ?? reminder.title;
    reminder.note = dto.note ?? reminder.note;
    reminder.allDay = dto.allDay ?? reminder.allDay;
    reminder.type = dto.type ?? reminder.type;

    this.applyAttachment(reminder, file);

    return this.remindersRepo.save(reminder);
  }

  async removeForUser(id: string, userId: string) {
    const reminder = await this.findOneForUser(id, userId);
    return this.remindersRepo.remove(reminder);
  }
}
