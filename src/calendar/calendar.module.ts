import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CalendarController } from './calendar.controller';
import { CalendarService } from './calendar.service';
import { Income } from 'src/finance/entities/income.entity';
import { Expense } from 'src/finance/entities/expense.entity';
import { Investment } from 'src/finance/entities/investment.entity';
import { ClientOrder } from 'src/client_orders/entities/client-order.entity';
import { Reminder } from 'src/reminders/entities/reminder.entity';
import { Company } from 'src/companies/entities/company.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Income,
      Expense,
      Investment,
      ClientOrder,
      Reminder,
      Company,
    ]),
  ],
  controllers: [CalendarController],
  providers: [CalendarService],
})
export class CalendarModule {}
