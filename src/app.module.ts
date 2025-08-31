import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

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
      useFactory: () => {
        const useSSL = process.env.POSTGRES_SSL === 'true';

        return {
          type: 'postgres',
          host: process.env.POSTGRES_HOST,
          port: parseInt(process.env.POSTGRES_PORT ?? '5432'),
          username: process.env.POSTGRES_USERNAME,
          password: process.env.POSTGRES_PASSWORD,
          database: process.env.POSTGRES_DATABASE,
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: true,
          ssl: process.env.POSTGRES_SSL === 'true',
          extra: {
            ssl: process.env.POSTGRES_SSL === 'true'
              ? { rejectUnauthorized: false } // útil en desarrollo
              : undefined,
          },
        };
      },
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