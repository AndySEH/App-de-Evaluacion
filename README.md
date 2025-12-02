# Demo App Video
 
https://youtu.be/wQFszT5EJ_4


# React Native with Expo, React Navigation, and TypeScript with a clean architecture

This is a starter project for building React Native apps with [Expo](https://expo.dev/), [React Navigation](https://reactnavigation.org/), and [TypeScript](https://www.typescriptlang.org/) using a clean architecture.

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Create a `.env` file in the root directory and add your Roble project ID

   ```
   EXPO_PUBLIC_ROBLE_PROJECT_ID=your_project_id_here
   ```

3. Start the app

   ```bash
   npx expo start
   ```

## Dependencies
- [Expo](https://expo.dev/) - A framework and platform for universal React applications.
- [React Navigation](https://reactnavigation.org/) - Routing and navigation for your React Native
- [Async Storage](https://react-native-async-storage.github.io/async-storage/) - An asynchronous, unencrypted, persistent, key-value storage system for React Native.

## Functions
- User authentication (login, logout, register) with Roble
- Product management (create, update, delete) with Roble

## Desarrollo con Docker 🐳

Este proyecto está configurado con **Docker** y **hot reload automático** para facilitar el desarrollo.

### Inicio rápido con Docker

```bash
# Construir e iniciar el contenedor
docker-compose up

# O usar el script de desarrollo (Windows PowerShell)
.\docker-dev.ps1 start

# O usar el script de desarrollo (Bash)
./docker-dev.sh start
```

### Características de Docker

✅ **Hot reload automático** - Los cambios en el código se reflejan inmediatamente  
✅ **Volúmenes configurados** - Tu código se monta en el contenedor  
✅ **Dependencias aisladas** - node_modules del contenedor no interfieren con tu sistema  
✅ **Scripts de desarrollo** - Comandos simplificados para operaciones comunes

📖 **Documentación completa**: Ver [DOCKER.md](./DOCKER.md) para más detalles

### Comandos útiles

```bash
# Ver logs
docker-compose logs -f

# Detener contenedor
docker-compose down

# Reconstruir después de cambios en package.json
docker-compose build --no-cache
docker-compose up
```