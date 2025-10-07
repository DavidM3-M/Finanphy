import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { ProductsModule } from 'src/products/products.module';
import { PublicService } from './public.service';

@Module({
  imports: [ProductsModule],
  controllers: [PublicController],
  providers: [PublicService]
})
export class PublicModule {}