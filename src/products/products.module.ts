import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Company } from 'src/companies/entities/company.entity'; // ✅ Importás la entidad Company
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, Company]), // ✅ Registrás ambos repositorios
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [TypeOrmModule], // ✅ Exportás el acceso a los repositorios
})
export class ProductsModule {}