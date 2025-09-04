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
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { CompaniesModule } from './companies/companies.module';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';

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
          synchronize: false,
          migrationsRun: true,
          migrations: [__dirname + '/migrations/*{.ts,.js}'],
          ssl: process.env.POSTGRES_SSL === 'true',
          extra: {
            ssl: process.env.POSTGRES_SSL === 'true'
              ? { rejectUnauthorized: false } 
              : undefined,
          },
        };
      },
    }),
    UsersModule,
    AuthModule,
    FinanceModule,
    ProductsModule,
    OrdersModule,
    CompaniesModule,
  ],
  controllers: [AppController, CompaniesController],
  providers: [AppService, CompaniesService],
})
export class AppModule {}