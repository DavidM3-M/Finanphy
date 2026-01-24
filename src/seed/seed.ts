import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from 'src/users/users.service';
import { Role } from 'src/auth/enums/role.enum';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);

  try {
    const existing = await usersService.findByEmail('admin@finanphy.com');
    if (existing) {
      console.log('Admin already exists. Seed cancelled.');
    } else {
      const hashedPassword = await bcrypt.hash('admin123', 10);

      await usersService.create({
        firstName: 'Admin',
        lastName: 'Root',
        email: 'admin@finanphy.com',
        password: hashedPassword,
        role: Role.Admin,
      });

      console.log('admin created');
    }
  } catch (error) {
    console.error('error wuth seed.', error);
  } finally {
    await app.close();
  }
}

bootstrap();
