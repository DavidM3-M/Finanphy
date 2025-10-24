import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import fs from 'fs';
import path from 'path';
import express from 'express';

async function ensureUploadsDir() {
  const uploadsDir = path.resolve(process.cwd(), 'uploads');
  try {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('Created uploads dir at', uploadsDir);
    } else {
      console.log('Uploads dir exists at', uploadsDir);
    }
    fs.accessSync(uploadsDir, fs.constants.W_OK);
  } catch (err) {
    console.error('Failed to ensure uploads dir', err);
    throw err;
  }
}

async function bootstrap() {
  // crear uploads antes de inicializar Nest
  await ensureUploadsDir();

  const app = await NestFactory.create(AppModule);

  // ValidationPipe global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://finanphy-dev-auth.onrender.com',
    'https://finanphy.vercel.app',
  ];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`Blocked by CORS: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Servir uploads como estático con headers controlados para evitar problemas de caché/CORS
  const uploadsPath = path.resolve(process.cwd(), 'uploads');
  app.use(
    '/uploads',
    express.static(uploadsPath, {
      etag: true,
      lastModified: true,
      setHeaders: (res, filepath) => {
        // permitir acceso desde frontend; ajustar dominio si necesitas restringir
        res.setHeader('Access-Control-Allow-Origin', '*');
        // Si los archivos llevan filename único (timestamp) usar cache largo e immutable
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      },
    }),
  );
  console.log(`Serving uploads from ${uploadsPath} at /uploads`);

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`App listening on ${port}`);
}

bootstrap().catch((err) => {
  console.error('Bootstrap failed', err);
  process.exit(1);
});