<h1 align="center">Finanphy — Backend API</h1>

<p align="center">
  Plataforma de gestión financiera y operacional para pequeñas y medianas empresas.<br/>
  Multi-empresa · Inventario · Finanzas · Reportes con IA · Catálogo público
</p>

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-11-E0234E?style=flat&logo=nestjs&logoColor=white" alt="NestJS"/>
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat&logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/PostgreSQL-14-4169E1?style=flat&logo=postgresql&logoColor=white" alt="PostgreSQL"/>
  <img src="https://img.shields.io/badge/TypeORM-0.3-FE0902?style=flat" alt="TypeORM"/>
  <img src="https://img.shields.io/badge/OpenAI-GPT--4-412991?style=flat&logo=openai&logoColor=white" alt="OpenAI"/>
  <img src="https://img.shields.io/badge/JWT-Auth-000000?style=flat&logo=jsonwebtokens&logoColor=white" alt="JWT"/>
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=flat&logo=docker&logoColor=white" alt="Docker"/>
  <img src="https://img.shields.io/badge/Deploy-Render-46E3B7?style=flat&logo=render&logoColor=white" alt="Render"/>
</p>

---

## Descripción general

**Finanphy** es una API REST construida con NestJS que permite a negocios gestionar sus operaciones financieras y comerciales desde un solo lugar:

- Registrar **ingresos, egresos e inversiones** con auditoría automática
- Gestionar **inventario** con control de stock y alertas de stock mínimo
- Ciclo completo de **órdenes de clientes**: creación → reserva de stock → confirmación → factura
- Directorio de **clientes** con historial de deuda y pagos con evidencia
- Gestión de **proveedores** y órdenes de compra
- **Calendario unificado** de eventos financieros y recordatorios
- **Reportes mensuales** con análisis generado por GPT-4
- **Catálogo público** compartible por QR sin autenticación

---

## Stack tecnológico

### Runtime & Framework

| Tecnología | Versión | Uso |
|---|---|---|
| **Node.js** | 20+ | Runtime |
| **NestJS** | 11 | Framework MVC modular con IoC/DI |
| **TypeScript** | 5 | Tipado estático end-to-end |

### Base de datos & ORM

| Tecnología | Versión | Uso |
|---|---|---|
| **PostgreSQL** | 14 | Base de datos relacional principal |
| **TypeORM** | 0.3 | ORM, entities y migraciones versionadas |
| **Stored Procedures** | — | 17 SPs para operaciones de escritura críticas |
| **Triggers** | — | 7 triggers: `updated_at`, auditoría y alertas de stock |

### Autenticación & Seguridad

| Tecnología | Uso |
|---|---|
| **Passport + JWT** | Estrategia JWT con guards globales |
| **bcrypt** | Hash de contraseñas |
| **class-validator + Joi** | Validación de DTOs y variables de entorno |
| **RBAC (Roles)** | Roles: `admin`, `user`, `seller`, `client` |

### Integraciones externas

| Servicio | Librería | Uso |
|---|---|---|
| **OpenAI GPT-4** | axios + @nestjs/axios | Reportes financieros con IA, retry exponencial |
| **Nodemailer (Gmail SMTP)** | nodemailer | Recuperación de contraseña por email |
| **Multer** | @nestjs/platform-express | Upload de imágenes y PDFs (productos, facturas, evidencias) |

### Infraestructura & DevOps

| Herramienta | Uso |
|---|---|
| **Docker Compose** | PostgreSQL 14 + pgAdmin local |
| **Render** | Despliegue del backend en producción |
| **Vercel** | Frontend React (repo separado) |

---

## Arquitectura

```
React SPA (Vercel)
     │ HTTPS / Bearer JWT
     ▼
NestJS API (Render)
  ├── Global: JwtAuthGuard → RolesGuard → ValidationPipe
  ├── AuthModule           /auth
  ├── UsersModule          /users
  ├── CompaniesModule      /companies
  ├── FinanceModule        /incomes  /expenses  /investments
  ├── ProductsModule       /products
  ├── ClientOrdersModule   /client-orders
  ├── CustomersModule      /customers
  ├── SuppliersModule      /suppliers
  ├── SupplierOrdersModule /supplier-orders
  ├── RemindersModule      /reminders
  ├── CalendarModule       /calendar
  ├── ReportsModule        /feedback
  ├── OpenaiModule         /openai
  ├── MailModule           (interno)
  └── PublicModule         /public  (sin auth)
     │
     ▼
PostgreSQL 14
  Stored Procedures + Triggers
```

---

## Módulos principales

| Módulo | Ruta | Descripción |
|---|---|---|
| **Auth** | `/auth` | Registro, login, JWT, recuperación de contraseña vía email |
| **Finance** | `/incomes` `/expenses` `/investments` | Contabilidad con SPs y auditoría automática |
| **Products** | `/products` | Inventario con imágenes y alerta de stock mínimo por trigger |
| **Client Orders** | `/client-orders` | Órdenes con reserva de stock, factura, ciclo de estados |
| **Customers** | `/customers` | CRM ligero: deuda, pagos con evidencia multipart |
| **Suppliers** | `/suppliers` `/supplier-orders` | Directorio y órdenes de compra con factura |
| **Reports** | `/feedback` | Reporte mensual agregado + análisis GPT-4 |
| **OpenAI** | `/openai/chat` | Proxy a GPT-4 con retry exponencial y rate limiting |
| **Public** | `/public` | Catálogo de productos sin autenticación (compartible por QR) |

---

## Decisiones técnicas

**Stored Procedures sobre ORM puro** — Las operaciones críticas (reserva de stock, pagos, finanzas) se ejecutan como SPs para garantizar atomicidad y centralizar la lógica en la BD.

**Triggers de BD** — `updated_at` automático en cada tabla, log de auditoría en INSERT/UPDATE/DELETE y alerta de stock mínimo completamente desacoplada del código de aplicación.

**Multi-tenant por JWT claim** — El `companyId` viaja en el payload del token. Todos los servicios lo extraen vía `@CurrentUser()` sin verificaciones manuales adicionales.

**Retry exponencial en OpenAI** — El servicio implementa reintentos con backoff 500ms → 1s → 2s → 4s para manejar rate limits de la API de IA.

**Uploads con UUID** — Los archivos (imágenes, PDFs) se guardan en `/uploads` con nombre UUID, evitando colisiones y exponiendo la URL como asset estático con CORS dinámico.

---

## Instalación y configuración local

### Requisitos
- Node.js 20+
- Docker Desktop

### 1. Variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
POSTGRES_HOST=           # host de la base de datos
POSTGRES_PORT=           # puerto PostgreSQL
POSTGRES_USERNAME=       # usuario de la BD
POSTGRES_PASSWORD=       # contraseña de la BD
POSTGRES_DATABASE=       # nombre de la BD
POSTGRES_SSL=            # true en producción

JWT_SECRET=              # clave secreta para firmar tokens JWT

OPENAI_API_KEY=          # clave de OpenAI
OPENAI_MAX_REQUESTS_PER_MINUTE=10

MAIL_HOST=               # servidor SMTP
MAIL_PORT=               # puerto SMTP
MAIL_USER=               # usuario del correo
MAIL_PASS=               # contraseña de aplicación

FRONTEND_URL=            # URL del frontend (para links de email)
```

### 2. Base de datos local

```bash
docker-compose up -d
```

### 3. Instalar dependencias y correr

```bash
npm install
npm run start:dev
# API disponible en http://localhost:3000
```

Las migraciones se aplican automáticamente al iniciar.

---

## Scripts disponibles

```bash
npm run start:dev        # Modo desarrollo con hot-reload
npm run start:prod       # Build + migraciones + servidor
npm run migration:run    # Aplicar migraciones pendientes
npm run migration:revert # Revertir última migración
npm run seed             # Poblar la BD con datos de prueba
npm run build            # Compilar para producción
npm run lint             # Lint con ESLint
npm run test             # Ejecutar tests unitarios
npm run test:e2e         # Tests end-to-end
```

---

## Colección Postman

El archivo [`Finanphy_Postman_Collection.json`](./Finanphy_Postman_Collection.json) contiene **54 requests** en **16 carpetas** con variables de entorno, descripciones y un script que guarda el token JWT automáticamente al hacer Login.

**Variables requeridas en Postman:**

| Variable | Valor |
|---|---|
| `baseUrl` | `http://localhost:3000` o URL de producción |
| `token` | Se llena automáticamente al ejecutar Login |
| `companyId` | UUID de la empresa del usuario |
| `userId` | UUID del usuario autenticado |

---

## Despliegue en producción

| Servicio | Plataforma | Notas |
|---|---|---|
| Backend API | **Render** | `npm run start:prod` aplica migraciones antes de levantar |
| Frontend | **Vercel** | React SPA en repositorio separado |
| Base de datos | **PostgreSQL Cloud** | SSL habilitado (`POSTGRES_SSL=true`) |

Los orígenes permitidos se configuran vía variables de entorno o directamente en `src/main.ts`.
