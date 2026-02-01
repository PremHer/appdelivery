# 📱 Carpeta de Descargas

Coloca aquí los APKs generados:

## Archivos Esperados

- `deliveryapp-cliente.apk` - App para clientes
- `deliveryapp-driver.apk` - App para repartidores

## Cómo Generar los APKs

### Opción 1: EAS Build (Recomendado)

```bash
# Instalar EAS CLI
npm install -g eas-cli
eas login

# Generar APK cliente
cd mobile-app
eas build -p android --profile preview

# Generar APK driver
cd driver-app
eas build -p android --profile preview
```

Descarga los APKs desde expo.dev y colócalos aquí.

### Opción 2: Build Local (Requiere Android Studio)

```bash
cd mobile-app
npx expo prebuild
cd android
./gradlew assembleRelease
```

El APK estará en `android/app/build/outputs/apk/release/`

## Después de Agregar los APKs

Los archivos serán accesibles desde:
- `https://tudominio.com/downloads/deliveryapp-cliente.apk`
- `https://tudominio.com/downloads/deliveryapp-driver.apk`
