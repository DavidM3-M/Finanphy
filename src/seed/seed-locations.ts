import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { Company } from '../companies/entities/company.entity';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  try {
    // Leer archivo JSON
    const filePath = path.join(__dirname, 'data', 'locations.json');
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const locations = JSON.parse(rawData);

    // Recorremos departamentos y municipios
    for (const loc of locations) {
      for (const city of loc.municipalities) {
        const company = dataSource.getRepository(Company).create({
          tradeName: `${city} Test Company`,
          legalName: `${city} Legal`,
          companyType: 'S.A.S.',
          taxId: '123456',
          city: city,
          state: loc.department,
        });
        await dataSource.getRepository(Company).save(company);
      }
    }

    console.log('✅ Seed de departamentos y municipios insertado.');
  } catch (error) {
    console.error('❌ Error en seed:', error);
  } finally {
    await app.close();
  }
}

bootstrap();
