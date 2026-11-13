# 📚 Librería Online

Tienda online de libros con catálogo, carrito persistente, autenticación de usuarios, panel de administración y pasarela de pagos con **Stripe (modo prueba)**.

Proyecto pensado como ejemplo de aplicación **Full Stack** desplegable, con arquitectura por capas en el backend y un diseño editorial inspirado en un estilo tipográfico con serif.

> ⚠️ Este proyecto usa Stripe en **modo prueba**. No se realizan cobros reales.

---

## ✨ Funcionalidades

- **Catálogo** de libros con búsqueda, filtros por categoría y paginación.
- **Detalle de libro** con precio, stock y descripción.
- **Autenticación** de usuarios con registro, login y JWT en cookie `httpOnly`.
- **Carrito persistente**: se guarda en base de datos para usuarios registrados y se fusiona al iniciar sesión.
- **Panel de administración** (solo rol `ADMIN`) para crear, editar y eliminar libros y gestionar el stock.
- **Checkout con Stripe Checkout** (tarjetas de prueba) y **webhooks** para confirmar pedidos.
- **Historial de pedidos** del usuario.

---

## 🧰 Stack tecnológico

| Capa | Tecnología |
|------|------------|
| Frontend | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4 |
| Backend | Node.js 20+, Express, TypeScript |
| Validación | Zod |
| Base de datos | PostgreSQL 16 |
| ORM | Prisma |
| Autenticación | JWT (access token en cookie `httpOnly`) + bcrypt |
| Pagos | Stripe Checkout + Webhooks (modo test) |
| Tests | Vitest (unitarios) + Supertest (integración) |
| Despliegue | Vercel (frontend), Render o Railway (backend), Neon o Supabase (PostgreSQL) |

---

## 🗂️ Estructura del proyecto

Monorepo con dos aplicaciones independientes:

```
bookstore/
├── README.md
├── docker-compose.yml          # PostgreSQL local
├── .env.example                # Variables de entorno de referencia
├── .gitignore
├── docs/
│   ├── DESIGN.md               # Guía de estilo visual
│   └── architecture.md         # Decisiones técnicas (pendiente)
│
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Modelo de datos
│   │   ├── migrations/         # Migraciones generadas por Prisma
│   │   └── seed.ts             # Datos de ejemplo (libros y admin)
│   ├── src/
│   │   ├── config/             # Variables de entorno y cliente de Stripe
│   │   ├── lib/                # Cliente de Prisma
│   │   ├── middlewares/        # auth, requireAdmin, validate, errorHandler
│   │   ├── modules/            # Un módulo por dominio (ver abajo)
│   │   │   ├── auth/
│   │   │   ├── books/
│   │   │   ├── cart/
│   │   │   ├── orders/
│   │   │   ├── payments/
│   │   │   └── admin/
│   │   ├── utils/              # Helpers (errores HTTP, precios en céntimos)
│   │   ├── app.ts              # Configuración de Express
│   │   └── server.ts           # Arranque del servidor
│   └── tests/
│
└── frontend/
    ├── public/
    └── src/
        ├── app/                # Rutas (App Router)
        │   ├── page.tsx                  # Catálogo
        │   ├── libros/[slug]/page.tsx    # Detalle de libro
        │   ├── carrito/page.tsx
        │   ├── checkout/page.tsx
        │   ├── pedido/[id]/page.tsx      # Confirmación / detalle de pedido
        │   ├── login/page.tsx
        │   ├── registro/page.tsx
        │   └── admin/libros/page.tsx     # Panel de administración
        ├── components/
        │   ├── ui/                 # Piezas básicas (enlace CTA, input, tag)
        │   ├── layout/             # Navegación y pie
        │   ├── books/              # Tarjeta y lista de libros
        │   └── cart/              # Resumen y líneas del carrito
        ├── lib/api.ts              # Cliente HTTP hacia el backend
        ├── store/cart-store.ts     # Estado del carrito
        ├── styles/                 # theme.css, variables.css, tokens.json
        └── types/                  # Tipos compartidos
```

### Organización del backend (por módulos)

Cada módulo sigue la misma estructura en capas:

```
modules/books/
├── books.routes.ts       # Define las rutas HTTP
├── books.controller.ts   # Lee req/res, llama al servicio
├── books.service.ts      # Lógica de negocio y acceso a Prisma
└── books.schemas.ts      # Esquemas Zod de entrada
```

Regla: **el controlador no toca Prisma** y **el servicio no conoce `req` ni `res`**.

---

## 🗄️ Modelo de datos

```
User ──< CartItem >── Book
  │                    │
  └──< Order >──< OrderItem >──┘
```

| Entidad | Campos principales |
|---------|--------------------|
| `User` | id, email (único), passwordHash, name, role (`USER` / `ADMIN`) |
| `Book` | id, slug (único), title, author, description, priceCents, stock, category, coverUrl |
| `CartItem` | id, userId, bookId, quantity (único por usuario+libro) |
| `Order` | id, userId, status (`PENDING` / `PAID` / `CANCELLED`), totalCents, stripeSessionId |
| `OrderItem` | id, orderId, bookId, quantity, unitPriceCents |

**Decisiones importantes:**

- Los precios se guardan en **céntimos (enteros)** para evitar errores de coma flotante.
- El precio del `OrderItem` se **copia** en el momento de la compra, así un cambio de precio posterior no altera pedidos antiguos.
- El stock se descuenta dentro de una **transacción de Prisma** junto con la creación del pedido.
- El frontend **nunca** envía precios: el backend siempre los recalcula desde la base de datos.

---

## 🔌 API (resumen)

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| GET | `/api/books` | Público | Lista de libros (`?q=`, `?category=`, `?page=`) |
| GET | `/api/books/:slug` | Público | Detalle de un libro |
| POST | `/api/auth/register` | Público | Registro |
| POST | `/api/auth/login` | Público | Inicio de sesión (devuelve cookie) |
| POST | `/api/auth/logout` | Usuario | Cierra sesión |
| GET | `/api/auth/me` | Usuario | Datos del usuario actual |
| GET | `/api/cart` | Usuario | Carrito actual |
| POST | `/api/cart/items` | Usuario | Añadir libro |
| PATCH | `/api/cart/items/:bookId` | Usuario | Cambiar cantidad |
| DELETE | `/api/cart/items/:bookId` | Usuario | Quitar libro |
| POST | `/api/orders/checkout` | Usuario | Crea pedido y sesión de Stripe |
| GET | `/api/orders` | Usuario | Historial de pedidos |
| GET | `/api/orders/:id` | Usuario | Detalle de un pedido |
| POST | `/api/payments/webhook` | Stripe | Recibe eventos de Stripe (verifica firma) |
| POST | `/api/admin/books` | Admin | Crear libro |
| PUT | `/api/admin/books/:id` | Admin | Editar libro |
| DELETE | `/api/admin/books/:id` | Admin | Eliminar libro |

---

## 🎨 Diseño

El diseño sigue la guía de `docs/DESIGN.md` y los tokens de `frontend/src/styles/`:

- **Fondo blanco** (`#ffffff`) como lienzo principal; el gris claro `#f2f2f2` solo para inputs y hover.
- **Tipografía**: EB Garamond 22px para el texto de lectura, DM Serif Display 54px para titulares, Fira Sans 14px para la interfaz.
- **Color de acento** `#d43008` solo para enlaces, logotipo y CTAs de texto. Nunca como relleno de botones.
- **CTAs** como texto en mayúsculas con flecha (`COMPRAR →`), no como botones con fondo.

> Nota: el proyecto toma la estructura visual y los tokens como referencia de estilo. Cambia el nombre, el logotipo y las ilustraciones por los tuyos antes de publicarlo.

---

## 🚀 Puesta en marcha en local

### Requisitos

- Node.js 20 o superior
- Docker (para PostgreSQL)
- Cuenta de Stripe en modo prueba y [Stripe CLI](https://stripe.com/docs/stripe-cli)

### 1. Clonar y preparar variables

```bash
git clone https://github.com/TU_USUARIO/bookstore.git
cd bookstore
cp .env.example backend/.env
cp .env.example frontend/.env.local
```

Rellena las claves en `backend/.env`:

```env
DATABASE_URL="postgresql://bookstore:bookstore@localhost:5432/bookstore"
JWT_SECRET="cambia-esto-por-una-cadena-larga-y-aleatoria"
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
FRONTEND_URL="http://localhost:3000"
PORT=4000
```

### 2. Base de datos

```bash
docker compose up -d
cd backend
npm install
npx prisma migrate dev
npx prisma db seed
```

### 3. Backend

```bash
cd backend
npm run dev        # http://localhost:4000
```

### 4. Frontend

```bash
cd frontend
npm install
npm run dev        # http://localhost:3000
```

### 5. Webhooks de Stripe (en otra terminal)

```bash
stripe login
stripe listen --forward-to localhost:4000/api/payments/webhook
```

Copia el `whsec_...` que muestra la CLI en `STRIPE_WEBHOOK_SECRET`.

### Tarjeta de prueba

Usa `4242 4242 4242 4242`, cualquier fecha futura y cualquier CVC.

### Usuario administrador de ejemplo

Lo crea el seed: `admin@bookstore.local` / `admin1234` (cámbialo en producción).

---

## 🧪 Tests

```bash
cd backend
npm test              # unitarios e integración
```

Prioridades de testing:

1. Cálculo de totales y precios.
2. Descuento de stock dentro de la transacción (no vender por encima del stock).
3. Verificación de firma en el webhook de Stripe.
4. Permisos: un `USER` no puede acceder a `/api/admin/*`.

---

## 🛣️ Hoja de ruta

- [x] **Fase 0 – Base**: monorepo, Docker, Prisma, Express y Next.js funcionando con "hola mundo".
- [x] **Fase 1 – Catálogo**: modelo `Book`, seed y listado con búsqueda y detalle.
- [x] **Fase 2 – Autenticación**: registro, login, JWT en cookie y rutas protegidas.
- [x] **Fase 3 – Carrito**: carrito persistente, fusión al hacer login.
- [x] **Fase 4 – Administración**: CRUD de libros solo para `ADMIN`.
- [ ] **Fase 5 – Pagos**: checkout con Stripe Checkout y webhook que confirma el pedido.
- [ ] **Fase 6 – Pedidos**: historial y página de confirmación.
- [ ] **Fase 7 – Calidad**: tests, validación de errores, README final con capturas.
- [ ] **Fase 8 – Despliegue**: frontend en Vercel, backend en Render, base de datos en Neon, webhook de Stripe apuntando a producción.

---

## ☁️ Despliegue

1. **Base de datos**: crea una instancia en Neon o Supabase y copia la `DATABASE_URL`.
2. **Backend** (Render o Railway): conecta el repositorio, indica la carpeta `backend/`, comando de build `npm install && npx prisma migrate deploy && npm run build` y de inicio `npm start`. Añade las variables de entorno.
3. **Frontend** (Vercel): importa el repositorio, indica la carpeta `frontend/` y añade `NEXT_PUBLIC_API_URL` apuntando al backend.
4. **Stripe**: crea un endpoint de webhook en el panel de prueba apuntando a `https://TU_BACKEND/api/payments/webhook` y usa su `whsec_` en producción.

---

## 📝 Licencia

MIT. Libre para estudiar, modificar y reutilizar.
