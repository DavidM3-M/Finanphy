import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://finanphy.com',
      'https://finanphy-dev-auth.onrender.com'
    ];

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`Blocked by CORS: ${origin}`);
      callback(null, false); // No error, solo rechaza silenciosamente
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
});

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');


  //validación global
  app.useGlobalPipes(new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,

}));
}
bootstrap();
