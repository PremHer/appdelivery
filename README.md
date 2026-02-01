# 🚀 Delivery App

Aplicación de delivery estilo Rappi/PedidosYa desarrollada con React Native (Expo) y Node.js.

## 📁 Estructura del Proyecto

```
appdelivery/
├── mobile-app/              # App móvil (React Native + Expo)
│   ├── src/
│   │   ├── components/      # Componentes reutilizables
│   │   │   ├── ui/          # Botones, Inputs, etc.
│   │   │   └── cards/       # Tarjetas de restaurantes, productos
│   │   ├── screens/         # Pantallas de la app
│   │   │   ├── auth/        # Login, Register
│   │   │   ├── home/        # Home, Search
│   │   │   ├── restaurant/  # Detalle, Menú
│   │   │   ├── cart/        # Carrito, Checkout
│   │   │   ├── orders/      # Historial, Tracking
│   │   │   └── profile/     # Perfil, Direcciones
│   │   ├── navigation/      # Configuración de navegación
│   │   ├── services/        # Llamadas a API
│   │   ├── context/         # Stores (Zustand)
│   │   ├── hooks/           # Custom hooks
│   │   ├── utils/           # Utilidades
│   │   ├── types/           # Tipos TypeScript
│   │   ├── constants/       # Colores, tamaños, config
│   │   └── assets/          # Imágenes, fonts
│   ├── App.tsx
│   └── package.json
│
├── backend/                  # API Backend (Node.js + Express)
│   ├── src/
│   │   ├── config/          # Configuración (Supabase, env)
│   │   ├── controllers/     # Controladores
│   │   ├── middleware/      # Auth, validación, errores
│   │   ├── routes/          # Rutas de la API
│   │   ├── services/        # Lógica de negocio
│   │   ├── types/           # Tipos TypeScript
│   │   ├── utils/           # Validadores, helpers
│   │   └── server.ts        # Punto de entrada
│   └── package.json
│
└── README.md
```

## 🛠️ Tecnologías

### Mobile App
- **React Native** + **Expo** (SDK 54)
- **TypeScript**
- **React Navigation** (Navegación)
- **Zustand** (Estado global)
- **React Hook Form** + **Zod** (Formularios y validación)
- **Axios** (HTTP Client)
- **Expo Linear Gradient**, **Expo Location**, **Expo Secure Store**

### Backend
- **Node.js** + **Express**
- **TypeScript**
- **Supabase** (PostgreSQL + Auth + Storage)
- **JWT** (Autenticación)
- **Zod** (Validación)
- **bcryptjs** (Hashing)

## 🚀 Inicio Rápido

### Prerrequisitos
- Node.js 18+
- npm o yarn
- Expo CLI (`npm install -g expo-cli`)
- Cuenta en [Supabase](https://supabase.com) (gratis)

### 1. Configurar Supabase

1. Crear un proyecto en [Supabase](https://supabase.com)
2. Ir a SQL Editor y ejecutar el script `backend/src/config/schema.sql`
3. Copiar las credenciales desde Project Settings > API

### 2. Configurar Backend

```bash
cd backend

# Instalar dependencias
npm install

# Copiar archivo de entorno
cp .env.example .env

# Editar .env con tus credenciales de Supabase
# SUPABASE_URL=tu_url
# SUPABASE_ANON_KEY=tu_anon_key
# SUPABASE_SERVICE_ROLE_KEY=tu_service_key
# JWT_SECRET=tu_secreto_de_32_caracteres_minimo

# Ejecutar seed (datos de ejemplo)
npm run db:seed

# Iniciar servidor de desarrollo
npm run dev
```

El servidor estará en: `http://localhost:3000`

### 3. Configurar App Móvil

```bash
cd mobile-app

# Instalar dependencias
npm install

# Iniciar Expo
npm start
```

Escanear el QR con la app **Expo Go** (Android/iOS).

## 📱 Módulos Implementados

### ✅ Módulo 1: Autenticación
- [x] Registro de usuarios
- [x] Login
- [x] Validación de formularios
- [x] JWT tokens
- [x] Persistencia de sesión

### 🚧 Módulo 2: Home & Navegación
- [x] Diseño de Home Screen
- [x] Categorías
- [x] Lista de restaurantes
- [x] Banner promocional
- [ ] Búsqueda funcional
- [ ] Geolocalización

### 📋 Próximos Módulos
- [ ] Módulo 3: Restaurantes & Productos
- [ ] Módulo 4: Carrito de Compras
- [ ] Módulo 5: Checkout & Pagos
- [ ] Módulo 6: Tracking en Tiempo Real
- [ ] Módulo 7: Historial & Reviews

## 🎨 Diseño

Los colores principales son:
- **Primary**: `#FF6B35` (Naranja)
- **Secondary**: `#2D3748` (Gris oscuro)
- **Accent**: `#10B981` (Verde)

## 📝 Scripts

### Backend
```bash
npm run dev      # Desarrollo con hot-reload
npm run build    # Compilar TypeScript
npm start        # Producción
npm run db:seed  # Poblar base de datos
```

### Mobile
```bash
npm start        # Iniciar Expo
npm run android  # Android emulator
npm run ios      # iOS simulator (macOS)
npm run web      # Navegador web
```

## 🔐 Variables de Entorno

### Backend (.env)
```env
PORT=3000
NODE_ENV=development
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
JWT_SECRET=your-super-secret-key-at-least-32-chars
JWT_EXPIRES_IN=7d
API_VERSION=v1
```

### Mobile (constants/index.ts)
Actualizar `API_CONFIG` y `SUPABASE_CONFIG` con tus credenciales.

## 📚 API Endpoints

### Auth
- `POST /api/v1/auth/register` - Registro
- `POST /api/v1/auth/login` - Login
- `GET /api/v1/auth/profile` - Obtener perfil
- `PATCH /api/v1/auth/profile` - Actualizar perfil
- `POST /api/v1/auth/change-password` - Cambiar contraseña

### Restaurantes (Por implementar)
- `GET /api/v1/restaurants` - Listar restaurantes
- `GET /api/v1/restaurants/:id` - Detalle
- `GET /api/v1/restaurants/:id/products` - Productos

### Pedidos (Por implementar)
- `POST /api/v1/orders` - Crear pedido
- `GET /api/v1/orders` - Historial
- `GET /api/v1/orders/:id` - Detalle/tracking

## 🤝 Contribuir

1. Fork el repositorio
2. Crear rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agregar funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📄 Licencia

MIT License - ver [LICENSE](LICENSE) para más detalles.
