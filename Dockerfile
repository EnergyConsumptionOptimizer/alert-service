# Stage 1: Build with Gradle
FROM gradle:9.3.1-jdk-jammy AS build
WORKDIR /usr/src/app

COPY gradlew gradle/ ./
COPY build.gradle.kts settings.gradle.kts gradle.properties ./
RUN ./gradlew --no-daemon dependencies || true
COPY . .
RUN ./gradlew --no-daemon assemble

# Stage 2: Runtime with Node.js
FROM node:24-alpine AS runtime
WORKDIR /app
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/package*.json ./
RUN npm install --omit=dev
EXPOSE 3000
CMD ["npm", "run", "start"]