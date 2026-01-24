import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Income } from 'src/finance/entities/income.entity';
import { Expense } from 'src/finance/entities/expense.entity';
import { Investment } from 'src/finance/entities/investment.entity';
import { ClientOrder } from 'src/client_orders/entities/client-order.entity';
import { Reminder } from 'src/reminders/entities/reminder.entity';
import { Company } from 'src/companies/entities/company.entity';
import { validateCompanyOwnership } from 'src/common/helpers/validateCompanyOwnership';

export type CalendarEventType =
  | 'income'
  | 'expense'
  | 'investment'
  | 'sale'
  | 'reminder';

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  allDay?: boolean;
  type: CalendarEventType;
  amount?: string | number;
  companyId?: string | null;
  extendedProps?: Record<string, unknown>;
}

@Injectable()
export class CalendarService {
  constructor(
    @InjectRepository(Income)
    private readonly incomeRepo: Repository<Income>,
    @InjectRepository(Expense)
    private readonly expenseRepo: Repository<Expense>,
    @InjectRepository(Investment)
    private readonly investmentRepo: Repository<Investment>,
    @InjectRepository(ClientOrder)
    private readonly ordersRepo: Repository<ClientOrder>,
    @InjectRepository(Reminder)
    private readonly remindersRepo: Repository<Reminder>,
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
  ) {}

  private parseDateInput(v?: string): Date | null {
    if (!v) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
      return new Date(`${v}T00:00:00.000Z`);
    }
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }

  private normalizeRange(from?: string, to?: string): { from: Date; to: Date } {
    const fromDate = this.parseDateInput(from);
    const toDate = this.parseDateInput(to);

    const now = new Date();
    const defaultFrom = new Date(now);
    defaultFrom.setDate(defaultFrom.getDate() - 30);
    const defaultTo = new Date(now);
    defaultTo.setDate(defaultTo.getDate() + 30);

    const finalFrom = fromDate ?? defaultFrom;
    const finalTo = toDate ?? defaultTo;

    if (finalFrom > finalTo) {
      throw new BadRequestException('Rango de fechas inválido');
    }

    return { from: finalFrom, to: finalTo };
  }

  async getEventsForUser(
    userId: string,
    from?: string,
    to?: string,
    companyId?: string,
  ): Promise<CalendarEvent[]> {
    const range = this.normalizeRange(from, to);

    let companyIds: string[] = [];

    if (companyId) {
      const company = await validateCompanyOwnership(
        this.companyRepo,
        companyId,
        userId,
      );
      companyIds = [company.id];
    } else {
      const companies = await this.companyRepo.find({ where: { userId } });
      companyIds = companies.map((c) => c.id);
    }

    const events: CalendarEvent[] = [];

    if (companyIds.length > 0) {
      const incomes = await this.incomeRepo
        .createQueryBuilder('income')
        .where('income.companyId IN (:...companyIds)', { companyIds })
        .andWhere(
          'COALESCE(income.entryDate, income.createdAt) BETWEEN :from AND :to',
          { from: range.from, to: range.to },
        )
        .getMany();

      incomes.forEach((income) => {
        const start = (income.entryDate ?? income.createdAt).toISOString();
        events.push({
          id: `income-${income.id}`,
          title: `Ingreso: ${income.category}`,
          start,
          type: 'income',
          amount: income.amount,
          companyId: income.companyId,
          extendedProps: {
            incomeId: income.id,
            description: income.description,
          },
        });
      });

      const expenses = await this.expenseRepo
        .createQueryBuilder('expense')
        .where('expense.companyId IN (:...companyIds)', { companyIds })
        .andWhere('expense.entryDate BETWEEN :from AND :to', {
          from: range.from,
          to: range.to,
        })
        .getMany();

      expenses.forEach((expense) => {
        events.push({
          id: `expense-${expense.id}`,
          title: `Gasto: ${expense.category}`,
          start: expense.entryDate.toISOString(),
          type: 'expense',
          amount: expense.amount,
          companyId: expense.companyId,
          extendedProps: {
            expenseId: expense.id,
            description: expense.description,
            supplier: expense.supplier,
          },
        });
      });

      const investments = await this.investmentRepo
        .createQueryBuilder('investment')
        .where('investment.companyId IN (:...companyIds)', { companyIds })
        .andWhere('investment.entryDate BETWEEN :from AND :to', {
          from: range.from,
          to: range.to,
        })
        .getMany();

      investments.forEach((investment) => {
        events.push({
          id: `investment-${investment.id}`,
          title: `Inversión: ${investment.category}`,
          start: investment.entryDate.toISOString(),
          type: 'investment',
          amount: investment.amount,
          companyId: investment.companyId,
          extendedProps: {
            investmentId: investment.id,
          },
        });
      });

      const orders = await this.ordersRepo
        .createQueryBuilder('order')
        .leftJoin('order.company', 'company')
        .where('company.id IN (:...companyIds)', { companyIds })
        .andWhere('order.createdAt BETWEEN :from AND :to', {
          from: range.from,
          to: range.to,
        })
        .getMany();

      orders.forEach((order) => {
        events.push({
          id: `sale-${order.id}`,
          title: `Venta: ${order.orderCode}`,
          start: order.createdAt.toISOString(),
          type: 'sale',
          companyId: order.company?.id,
          extendedProps: {
            orderId: order.id,
            status: order.status,
            itemsCount: order.items?.length ?? 0,
            userId: order.userId,
          },
        });
      });
    }

    const remindersQb = this.remindersRepo
      .createQueryBuilder('reminder')
      .where('reminder.userId = :userId', { userId })
      .andWhere('reminder.remindAt BETWEEN :from AND :to', {
        from: range.from,
        to: range.to,
      });

    if (companyId) {
      remindersQb.andWhere('reminder.companyId = :companyId', { companyId });
    }

    const reminders = await remindersQb.getMany();

    reminders.forEach((reminder) => {
      events.push({
        id: `reminder-${reminder.id}`,
        title: reminder.title,
        start: reminder.remindAt.toISOString(),
        allDay: reminder.allDay,
        type: 'reminder',
        companyId: reminder.companyId ?? undefined,
        extendedProps: {
          reminderId: reminder.id,
          note: reminder.note,
          reminderType: reminder.type,
        },
      });
    });

    return events;
  }
}
