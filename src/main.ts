import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import fs from 'fs';
import path from 'path';
import express, {
  type NextFunction,
  type Request,
  type Response,
} from 'express';

function ensureUploadsDir() {
  const uploadsDir = path.resolve(process.cwd(), 'uploads');
  try {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true, mode: 0o755 });
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
  ensureUploadsDir();

  const app = await NestFactory.create(AppModule);

  // ValidationPipe global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS: lista de orígenes permitidos
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://finanphy-dev-auth.onrender.com',
    'https://finanphy.vercel.app',
  ];

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin) {
        callback(null, true); // allow server-to-server or tools
        return;
      }
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      console.warn(`Blocked by CORS: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Middleware que coloca Access-Control-Allow-Origin dinámico para los assets estáticos
  app.use((req: Request, res: Response, next: NextFunction) => {
    const originHeader: unknown = req.headers.origin;
    let origin: string | undefined;
    if (typeof originHeader === 'string') {
      origin = originHeader;
    } else if (
      Array.isArray(originHeader) &&
      typeof originHeader[0] === 'string'
    ) {
      origin = originHeader[0];
    }
    if (!origin || origin.length === 0) {
      next();
      return;
    }
    if (allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    next();
  });

  // Servir uploads como estático con headers de caché razonables
  const uploadsPath = path.resolve(process.cwd(), 'uploads');
  app.use(
    '/uploads',
    express.static(uploadsPath, {
      etag: true,
      lastModified: true,
      setHeaders: (res: Response) => {
        // Asumimos filenames únicos (UUID). Cache largo y immutable es correcto.
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
