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
   ROBLE_PROJECT_ID=your_project_id_here
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

## For developing, start as a Docker container with the next commands
docker build -t rn-expo-app .

docker run --rm -it --name rn-expo-app `  -p 19000:19000 -p 19001:19001 -p 19002:19002 -p 8081:8081 -p 19006:19006 `  -e ROBLE_PROJECT_ID=tu_project_id `  -e REACT_NATIVE_PACKAGER_HOSTNAME=host.docker.internal `  -v "${PWD}:/app" -v /app/node_modules `  rn-expo-app