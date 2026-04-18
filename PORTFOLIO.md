# Finanphy — Documentación de Portafolio

> Plataforma de gestión financiera y operacional para pequeñas y medianas empresas.

---

## Tabla de Contenidos

1. [Descripción General](#descripción-general)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Arquitectura del Sistema](#arquitectura-del-sistema)
4. [Flujo de la Aplicación](#flujo-de-la-aplicación)
5. [Módulos del Backend](#módulos-del-backend)
6. [Módulos del Frontend](#módulos-del-frontend)
7. [Base de Datos](#base-de-datos)
8. [Seguridad y Autenticación](#seguridad-y-autenticación)
9. [Infraestructura y Despliegue](#infraestructura-y-despliegue)
10. [Decisiones Técnicas Destacadas](#decisiones-técnicas-destacadas)

---

## Descripción General

**Finanphy** es una aplicación web full-stack orientada a negocios multi-empresa. Permite a los usuarios:

- Registrar y visualizar **ingresos, egresos e inversiones**
- Gestionar **inventario de productos** con control de stock
- Crear y administrar **órdenes de clientes** y **órdenes a proveedores**
- Mantener un directorio de **clientes** con historial de deuda y pagos
- Consultar un **calendario de eventos** financieros y recordatorios
- Generar **reportes mensuales** con análisis asistido por **IA (GPT-4)**
- Compartir un **catálogo público** con carrito de compras embebido vía QR
- Recibir alertas de stock bajo mediante **triggers de base de datos**

---

## Stack Tecnológico

### Backend

| Tecnología | Versión | Rol |
|---|---|---|
| **Node.js** | 20+ | Runtime |
| **NestJS** | 11 | Framework principal (MVC modular, IoC) |
| **TypeScript** | 5 | Tipado estático |
| **TypeORM** | 0.3 | ORM y gestión de migraciones |
| **PostgreSQL** | 14 | Base de datos relacional |
| **Passport / JWT** | — | Autenticación con estrategia JWT |
| **bcrypt** | 6 | Hash de contraseñas |
| **Nodemailer** | 7 | Envío de correos transaccionales |
| **Multer** | — | Carga de archivos (imágenes, PDF) |
| **OpenAI API** | GPT-4 | Análisis financiero con IA |
| **class-validator** | 0.14 | Validación de DTOs |
| **Joi** | 18 | Validación de variables de entorno |
| **Docker / Docker Compose** | — | Entorno local de desarrollo |

### Frontend

| Tecnología | Versión | Rol |
|---|---|---|
| **React** | 19 | Librería UI |
| **TypeScript** | 4.9 | Tipado estático |
| **React Router DOM** | 7 | Enrutamiento SPA |
| **TailwindCSS** | — | Estilos utilitarios |
| **Recharts** | 3 | Gráficas y visualización de datos |
| **Framer Motion** | 12 | Animaciones de interfaz |
| **@react-pdf/renderer** | 4 | Generación de PDFs en cliente |
| **Headless UI** | 2 | Componentes accesibles sin estilos |
| **Lucide React** | — | Iconografía |
| **Axios** | 1 | Cliente HTTP |
| **react-hot-toast** | 2 | Notificaciones |
| **dayjs / date-fns** | — | Manipulación de fechas |
| **Papaparse** | 5 | Exportación/importación CSV |
| **xlsx** | — | Exportación a Excel |
| **qrcode.react** | 4 | Generación de QR para catálogo público |

---

## Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENTE (Browser)                          │
│                                                                     │
│   React SPA (Vercel)                                                │
│   ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────────┐  │
│   │  AuthCtx  │  │ ProductCtx│  │  CartCtx  │  │ React Router  │  │
│   └───────────┘  └───────────┘  └───────────┘  └───────────────┘  │
│   Pages: Dashboard │ Finance │ Inventory │ Orders │ Customers      │
│          Reports   │ Calendar│ Suppliers │ Catalog(público)        │
└────────────────────────────────┬────────────────────────────────────┘
                                 │ HTTPS / REST API
                                 │ Bearer JWT
┌────────────────────────────────▼────────────────────────────────────┐
│                         BACKEND (Render)                            │
│                                                                     │
│   NestJS Application                                                │
│   ┌──────────────────────────────────────────────────────────────┐ │
│   │  Global: JwtAuthGuard → RolesGuard → ValidationPipe          │ │
│   └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
│   ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│   │  Auth   │ │ Finance │ │ Products │ │ Orders   │ │Customers │ │
│   │ Module  │ │ Module  │ │ Module   │ │ Module   │ │ Module   │ │
│   └─────────┘ └─────────┘ └──────────┘ └──────────┘ └──────────┘ │
│   ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│   │Suppliers│ │Calendar │ │Reminders │ │ Reports  │ │  OpenAI  │ │
│   │ Module  │ │ Module  │ │ Module   │ │ Module   │ │ Module   │ │
│   └─────────┘ └─────────┘ └──────────┘ └──────────┘ └──────────┘ │
│                                                                     │
│   ┌──────────────────────────┐  ┌───────────────────────────────┐  │
│   │  TypeORM + Migrations    │  │  Stored Procedures + Triggers │  │
│   └──────────────────────────┘  └───────────────────────────────┘  │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────────────┐
│                       PostgreSQL 14                                  │
│   Schemas: users, companies, finance, products, orders, customers   │
│            suppliers, reminders, calendar, audit_log                │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Flujo de la Aplicación

### 1. Registro y autenticación

```
Usuario → POST /auth/register
         ├─ Valida DTO (class-validator)
         ├─ Hashea contraseña (bcrypt)
         ├─ Crea UserEntity + CompanyEntity
         └─ Retorna { access_token: JWT }

Usuario → POST /auth/login
         ├─ Verifica credenciales
         └─ Firma JWT (1h) con { sub, email, role, companyId }

Usuario → POST /auth/forgot-password
         ├─ Genera token de reset
         └─ Envía email via Nodemailer (Gmail SMTP)

JWT → Guard global (JwtAuthGuard)
    └─ Todas las rutas protegidas validan Bearer token automáticamente
```

### 2. Gestión Financiera

```
Usuario autenticado
  ├─ GET /incomes?page=1&limit=20   → Lista paginada filtrada por companyId del token
  ├─ POST /incomes                  → sp_create_income (Stored Procedure)
  │     ├─ Inserta registro
  │     └─ Trigger updated_at + audit_log
  ├─ PUT /incomes/:id               → sp_update_income
  └─ DELETE /incomes/:id            → sp_delete_income

  (misma estructura para /expenses y /investments)
```

### 3. Inventario de Productos

```
POST /products
  ├─ Valida DTO + rol (User/Admin/Seller)
  ├─ Multer intercepta imagen (JPEG/PNG/WebP, máx 10MB)
  ├─ Guarda en /uploads con UUID como nombre
  └─ Persiste producto con URL de imagen

GET /products/:id/image
  └─ Sirve archivo estático con CORS dinámico

Trigger de alerta de stock:
  └─ Al UPDATE de stock → si stock < stock_min → inserta alerta en reminders
```

### 4. Ciclo de Orden de Cliente

```
POST /client-orders
  ├─ Crea orden con status: 'pendiente'
  └─ sp_reserve_product_stock → descuenta stock de cada ítem

PUT /client-orders/:id  (status: 'cancelada')
  └─ sp_restore_product_stock → devuelve stock a inventario

POST /client-orders/:id/invoice
  └─ Sube PDF de factura con Multer

Orden genera Income:
  └─ Al confirmar pago → crea Income vinculado a la orden y al cliente
```

### 5. Gestión de Clientes y Pagos

```
POST /customers
  └─ sp_create_customer → registra cliente con deuda inicial = 0

POST /customers/:id/payments
  └─ sp_register_customer_payment
       ├─ Descuenta deuda del cliente
       ├─ Crea registro de pago con evidencia (imagen/PDF)
       └─ Actualiza balance en tiempo real

GET /customers/:id/debt-summary
  └─ Resumen de deuda total vs. pagos realizados
```

### 6. Proveedores y Órdenes de Compra

```
POST /suppliers          → Crea proveedor vinculado a empresa
POST /supplier-orders    → Registra compra con monto y proveedor
POST /supplier-orders/:id/invoice
  └─ Sube factura del proveedor (PDF/imagen, máx 15MB)
```

### 7. Reportes con IA

```
GET /feedback/monthly?period=2026-04
  ├─ ReportsService agrega datos del período:
  │     incomes, expenses, investments, top productos, estado de órdenes
  ├─ Construye prompt estructurado con los datos financieros
  ├─ POST → OpenAI API (GPT-4) con retry exponencial (hasta 4 intentos)
  │     ├─ Rate limit: configurable (OPENAI_MAX_REQUESTS_PER_MINUTE)
  │     └─ Timeout: 60s
  └─ Retorna análisis en lenguaje natural + métricas calculadas
```

### 8. Catálogo Público

```
GET /catalogo/:companyId   (ruta pública, sin autenticación)
  ├─ Carga productos de la empresa con ProductsProvider
  ├─ CartProvider gestiona estado del carrito (localStorage)
  ├─ Usuario agrega productos → CartPanel deslizable
  └─ CatalogoQr.tsx genera QR con URL del catálogo
```

### 9. Calendario y Recordatorios

```
GET /calendar/events?from=2026-04-01&to=2026-04-30
  └─ Agrega eventos de: vencimientos de órdenes, recordatorios, fechas de pago

POST /reminders
  ├─ Crea recordatorio manual
  └─ Soporta adjunto de imagen/PDF (Multer)
```

---

## Módulos del Backend

| Módulo | Ruta base | Responsabilidad |
|---|---|---|
| **AuthModule** | `/auth` | Registro, login, JWT, recuperación de contraseña |
| **UsersModule** | `/users` | CRUD de usuarios |
| **CompaniesModule** | `/companies` | Gestión de empresas multi-tenant |
| **FinanceModule** | `/incomes`, `/expenses`, `/investments` | Contabilidad básica |
| **ProductsModule** | `/products` | Inventario con imágenes y control de stock |
| **ClientOrdersModule** | `/client-orders` | Órdenes de venta, items, facturas |
| **CustomersModule** | `/customers` | Directorio, deuda, historial de pagos |
| **SuppliersModule** | `/suppliers` | Directorio de proveedores |
| **SupplierOrdersModule** | `/supplier-orders` | Órdenes de compra |
| **RemindersModule** | `/reminders` | Alertas y recordatorios con adjuntos |
| **CalendarModule** | `/calendar` | Vista unificada de eventos |
| **ReportsModule** | `/feedback` | Reportes mensuales con IA |
| **OpenaiModule** | — | Proxy a OpenAI con retry y rate-limit |
| **MailModule** | — | Servicio de correo transaccional |
| **PublicModule** | `/public`, `/catalogo` | Endpoints sin autenticación |

---

## Módulos del Frontend

| Página / Componente | Ruta | Descripción |
|---|---|---|
| **Login / Register** | `/auth/login`, `/auth/register` | Autenticación con gestión de token en contexto |
| **ForgotPassword / ResetPassword** | `/auth/forgot-password` | Flujo de recuperación por email |
| **Dashboard** | `/app/dashboard` | Resumen de KPIs, gráficas (Recharts) |
| **Clasificacion** | `/app/clasificacion` | Vista de finanzas (ingresos/egresos/inversiones) |
| **Facturacion** | `/app/facturacion` | Gestión de facturas |
| **DailyReports** | `/app/reports` | Reportes diarios con exportación PDF/Excel |
| **ProductsView** | `/app/inventory/products` | Inventario con upload de imágenes |
| **Orders** | `/app/orders` | Órdenes de clientes con lifecycle completo |
| **Customers** | `/app/customers` | CRM ligero con historial de pagos |
| **Calendar** | `/app/calendar` | Calendario de eventos financieros |
| **CompanyCatalog** | `/catalogo/:companyId` | Catálogo público + carrito de compras |

### Patrones de Estado

- **AuthContext**: token JWT, datos de usuario/empresa, carga inicial
- **ProductsContext**: caché de productos con soporte `publicMode`
- **CartContext**: carrito en memoria (catálogo público)
- **Axios interceptors**: adjunta `Authorization: Bearer` automáticamente

---

## Base de Datos

### Estrategia de Migraciones

- **50+ migraciones** versionadas con timestamps
- Se ejecutan automáticamente al iniciar (`migrationsRun: true`)
- Script `run-migrations-and-start.ts` garantiza el orden en producción

### Stored Procedures (17 SPs)

Operaciones de escritura críticas encapsuladas en la BD:

| Grupo | Stored Procedures |
|---|---|
| **Finance** | `sp_create_income`, `sp_update_income`, `sp_delete_income`, `sp_create_expense`, `sp_update_expense`, `sp_delete_expense`, `sp_create_investment`, `sp_update_investment`, `sp_delete_investment` |
| **Customers** | `sp_create_customer`, `sp_update_customer`, `sp_register_customer_payment` |
| **Products** | `sp_create_product`, `sp_update_product` |
| **Stock** | `sp_reserve_product_stock`, `sp_restore_product_stock` |

### Triggers (7)

| Trigger | Acción |
|---|---|
| `trg_*_updated_at` | Actualiza `updated_at` automáticamente en cada UPDATE |
| `trg_audit_*` | Registra cambios en `audit_log` (INSERT / UPDATE / DELETE) |
| `trg_stock_alert` | Inserta alerta en `reminders` cuando `stock < stock_min` |

### Modelo Multi-Tenant

- Cada `UserEntity` está vinculado a una `CompanyEntity`
- Todos los recursos filtran por `companyId` extraído del JWT
- Un usuario Admin puede consultar recursos de cualquier empresa

---

## Seguridad y Autenticación

| Mecanismo | Implementación |
|---|---|
| **Autenticación** | JWT firmado con secret de entorno, expira en 1h |
| **Contraseñas** | Hash con bcrypt (salt rounds configurable) |
| **Autorización** | `RolesGuard` + decorador `@Roles()` por endpoint |
| **Validación** | `ValidationPipe` global (whitelist, forbidNonWhitelisted) |
| **Variables de entorno** | Validadas con esquema Joi al arrancar |
| **CORS** | Lista blanca de orígenes explícita |
| **Uploads** | Validación de MIME type + límite de tamaño por módulo |
| **Rutas públicas** | Marcadas explícitamente con decorador `@Public()` |
| **Recuperación de contraseña** | Token de reset de un solo uso por email |

**Roles disponibles:**

| Rol | Permisos |
|---|---|
| `admin` | Acceso total, puede consultar cualquier empresa |
| `user` | Acceso a los recursos de su empresa |
| `seller` | Acceso a productos y órdenes |
| `client` | Solo catálogo público |

---

## Infraestructura y Despliegue

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Vercel         │     │   Render         │     │  PostgreSQL      │
│   (Frontend)     │────▶│   (Backend)      │────▶│  (Cloud DB)      │
│   React SPA      │     │   NestJS API     │     │  PostgreSQL 14   │
│   Build estático │     │   Puerto 3000    │     │  SSL habilitado  │
└──────────────────┘     └──────────────────┘     └──────────────────┘

Desarrollo local:
┌─────────────────────────────────────┐
│  Docker Compose                     │
│  ├─ postgres:14.1-alpine → :5436    │
│  └─ pgAdmin 4 → :5050              │
└─────────────────────────────────────┘
```

### Variables de Entorno Requeridas

```env
POSTGRES_HOST=
POSTGRES_PORT=5432
POSTGRES_USERNAME=
POSTGRES_PASSWORD=
POSTGRES_DATABASE=
POSTGRES_SSL=false
JWT_SECRET=
OPENAI_API_KEY=
OPENAI_MAX_REQUESTS_PER_MINUTE=10
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=
MAIL_PASS=
FRONTEND_URL=
```

---

## Decisiones Técnicas Destacadas

### Stored Procedures sobre ORM puro
Las operaciones críticas de escritura (reserva de stock, registro de pagos, creación de finanzas) se ejecutan como stored procedures para garantizar atomicidad, reducir round-trips y centralizar la lógica de negocio en la base de datos.

### Triggers para integridad automática
Los triggers de `updated_at` eliminan código repetitivo en los servicios. El trigger de alerta de stock desacopla la lógica de notificación del código de aplicación.

### Multi-tenant por JWT claim
El `companyId` viaja en el payload del JWT y todos los servicios lo extraen via `@CurrentUser()`. Esto evita que un usuario acceda a datos de otra empresa sin necesidad de verificaciones explícitas en cada query.

### OpenAI con retry exponencial
El servicio de IA implementa reintentos con backoff exponencial (500ms → 1s → 2s → 4s) para manejar rate limits y errores temporales de la API, garantizando disponibilidad del feature de reportes.

### Catálogo público aislado
La rama `/catalogo/:companyId` está envuelta en sus propios `CartProvider` y `ProductsProvider` con `publicMode`, completamente aislada del contexto autenticado, permitiendo compartirla sin autenticación.

### Migraciones versionadas
Con 50+ migraciones, el historial completo de la base de datos está auditado. `run-migrations-and-start.ts` garantiza que en cada despliegue se apliquen las migraciones pendientes antes de levantar el servidor.
