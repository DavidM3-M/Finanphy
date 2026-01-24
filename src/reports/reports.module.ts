// src/reports/reports.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { ReportsRepository } from './reports.repository';
import { RulesService } from './rules.service';
import { DbService } from 'src/db/db.service';
import { Product } from '../products/entities/product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product])],
  controllers: [ReportsController],
  providers: [ReportsService, ReportsRepository, RulesService, DbService],
  exports: [ReportsService],
})
export class ReportsModule {}
