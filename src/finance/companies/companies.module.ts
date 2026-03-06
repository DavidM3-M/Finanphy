import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { Company } from './entities/companies.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Company]), //ESTO FALTABA
  ],
  controllers: [CompaniesController],
  providers: [CompaniesService],
  exports: [CompaniesService], // opcional pero recomendado si otro módulo lo usa
})
export class CompaniesModule {}