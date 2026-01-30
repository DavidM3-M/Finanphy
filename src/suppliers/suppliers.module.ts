import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SuppliersController } from './suppliers.controller';
import { SuppliersService } from './suppliers.service';
import { Supplier } from './entities/supplier.entity';
import { Company } from 'src/companies/entities/company.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Supplier, Company])],
  controllers: [SuppliersController],
  providers: [SuppliersService],
  exports: [SuppliersService],
})
export class SuppliersModule {}
