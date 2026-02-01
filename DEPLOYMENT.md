# 🚀 Guía de Deployment a Railway

## Arquitectura de Servicios

```
Railway Project
├── backend (API Node.js)     → api.tuapp.railway.app
├── admin-dashboard (Static)  → admin.tuapp.railway.app
└── landing-page (Static)     → tuapp.railway.app
```

## Paso 1: Crear Cuenta en Railway

1. Ve a [railway.app](https://railway.app)
2. Regístrate con GitHub
3. Crea un nuevo proyecto

## Paso 2: Subir Código a GitHub

```bash
# En la carpeta appdelivery
git init
git add .
git commit -m "Initial commit - Delivery App"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/appdelivery.git
git push -u origin main
```

## Paso 3: Configurar Servicios en Railway

### Backend API
1. Clic en "New Service" → "GitHub Repo"
2. Selecciona tu repositorio
3. Configura "Root Directory": `backend`
4. Railway detectará el Dockerfile automáticamente
5. Agregar variables de entorno:
   - `NODE_ENV=production`
   - `PORT=3001`
   - `SUPABASE_URL=tu_supabase_url`
   - `SUPABASE_ANON_KEY=tu_anon_key`

### Admin Dashboard
1. Clic en "New Service" → "GitHub Repo"
2. Configura "Root Directory": `admin-dashboard`
3. Variables: (ninguna requerida, usa Supabase del cliente)

### Landing Page
1. Clic en "New Service" → "GitHub Repo"
2. Configura "Root Directory": `landing-page`
3. Variables: (ninguna requerida)

## Paso 4: Configurar Dominios

En cada servicio:
1. Settings → Networking → Generate Domain
2. O configura tu dominio personalizado

## Paso 5: Build de Apps Móviles (EAS)

### Requisitos
```bash
npm install -g eas-cli
eas login
```

### Build APK (Android)
```bash
# Mobile App
cd mobile-app
eas build -p android --profile preview

# Driver App
cd driver-app
eas build -p android --profile preview
```

### Descargar APKs
Después del build, los APKs estarán disponibles en:
- https://expo.dev/accounts/TU_CUENTA/projects/mobile-app/builds
- https://expo.dev/accounts/TU_CUENTA/projects/driver-app/builds

## Paso 6: Hostear APKs en Landing Page

1. Descarga los APKs generados
2. Súbelos a un storage (ej: Supabase Storage)
3. Actualiza los links en la landing page

## Variables de Entorno Requeridas

### Backend
| Variable | Descripción |
|----------|-------------|
| NODE_ENV | `production` |
| PORT | `3001` |
| SUPABASE_URL | URL de tu proyecto Supabase |
| SUPABASE_ANON_KEY | Anon key de Supabase |

### Mobile Apps (en app.json)
| Variable | Descripción |
|----------|-------------|
| EXPO_PUBLIC_SUPABASE_URL | URL de Supabase |
| EXPO_PUBLIC_SUPABASE_ANON_KEY | Anon key |

## Checklist Final

- [ ] Código subido a GitHub
- [ ] Backend desplegado en Railway
- [ ] Admin Dashboard desplegado en Railway
- [ ] Landing Page desplegada en Railway
- [ ] Mobile App APK generado con EAS
- [ ] Driver App APK generado con EAS
- [ ] Links de descarga actualizados en landing page
