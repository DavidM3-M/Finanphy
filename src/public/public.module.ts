import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { ProductsModule } from 'src/products/products.module';

@Module({
  imports: [ProductsModule],
  controllers: [PublicController],
})
export class PublicModule {}