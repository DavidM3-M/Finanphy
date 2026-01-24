import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RemindersController } from './reminders.controller';
import { RemindersService } from './reminders.service';
import { Reminder } from './entities/reminder.entity';
import { Company } from 'src/companies/entities/company.entity';
import { Income } from 'src/finance/entities/income.entity';
import { ClientOrder } from 'src/client_orders/entities/client-order.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Reminder, Company, Income, ClientOrder])],
  controllers: [RemindersController],
  providers: [RemindersService],
  exports: [RemindersService],
})
export class RemindersModule {}
