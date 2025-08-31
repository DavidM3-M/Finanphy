import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';

// Módulos Melo
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';

// Módulos Camilo
import { FinanceModule } from './finance/finance.module';
import { InventoryModule } from './inventory/inventory.module';
import { ProductsModule } from './products/products.module';
import { ExpensesModule } from './expenses/expenses.module';
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: process.env.POSTGRESS_HOST,
        port: parseInt(process.env.POSTGRES_PORT ?? '5432'),
        username: process.env.POSTGRES_USERNAME ,
        password: process.env.POSTGRES_PASSWORD ,
        database: process.env.POSTGRES_DATABASE ,
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true, 
      }),
    }),
    UsersModule,
    AuthModule,
    FinanceModule,
    InventoryModule,
    ProductsModule,
    ExpensesModule,
    OrdersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}