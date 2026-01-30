import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import * as Joi from 'joi';

import { AuthGuard } from './auth/guards/auth.guard';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { FinanceModule } from './finance/finance.module';
import { ProductsModule } from './products/products.module';
import { CompaniesModule } from './companies/companies.module';
import { ClientOrdersModule } from './client_orders/client-orders.module';
import { PublicModule } from './public/public.module';
import { ReportsModule } from './reports/reports.module';
import { CustomersModule } from './customers/customers.module';
import { RemindersModule } from './reminders/reminders.module';
import { CalendarModule } from './calendar/calendar.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { SupplierOrdersModule } from './supplier_orders/supplier-orders.module';

import { OpenaiModule } from './openai/openai.module';
import { MailModule } from './mail/mail.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: Joi.object({
        POSTGRES_HOST: Joi.string().required(),
        POSTGRES_PORT: Joi.number().default(5432),
        POSTGRES_USERNAME: Joi.string().required(),
        POSTGRES_PASSWORD: Joi.string().required(),
        POSTGRES_DATABASE: Joi.string().required(),
        POSTGRES_SSL: Joi.boolean().default(false),
        JWT_SECRET: Joi.string().required(),
        // valida la clave de OpenAI
        OPENAI_API_KEY: Joi.string().required(),
        OPENAI_MAX_REQUESTS_PER_MINUTE: Joi.number().default(10),
      }),
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('POSTGRES_HOST'),
        port: config.get<number>('POSTGRES_PORT'),
        username: config.get<string>('POSTGRES_USERNAME'),
        password: config.get<string>('POSTGRES_PASSWORD'),
        database: config.get<string>('POSTGRES_DATABASE'),
        ssl: config.get<boolean>('POSTGRES_SSL')
          ? { rejectUnauthorized: false }
          : false,
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        synchronize: false,
        migrationsRun: true,
        logging: false,
      }),
    }),

    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
    }),

    // módulos de dominio
    UsersModule,
    AuthModule,
    FinanceModule,
    ProductsModule,
    CompaniesModule,
    ClientOrdersModule,
    PublicModule,
    ReportsModule,
    MailModule,
    CustomersModule,
    SuppliersModule,
    SupplierOrdersModule,
    RemindersModule,
    CalendarModule,

    // importa OpenaiModule aquí
    OpenaiModule,
  ],

  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
