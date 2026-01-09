const envNumber = (name: string, fallback: number): number => {
  const raw = process.env[name];
  if (raw == null || raw.trim() === "") return fallback;

  const value = Number(raw);
  if (!Number.isFinite(value)) {
    throw new Error(`Invalid numeric env var ${name}="${raw}"`);
  }
  return value;
};

const serverPort = envNumber("PORT", 3000);

const mongoHost = process.env.MONGODB_HOST ?? "localhost";
const mongoPort = envNumber("MONGODB_PORT", 27017);
const mongoDb = process.env.MONGO_DB ?? "alerts";

const userServiceHost = process.env.USER_SERVICE_HOST ?? "user-service";
const userServicePort = envNumber("USER_SERVICE_PORT", 3001);

export const config = Object.freeze({
  server: Object.freeze({
    port: serverPort,
  }),
  db: Object.freeze({
    uri:
      process.env.MONGO_URI ?? `mongodb://${mongoHost}:${mongoPort}/${mongoDb}`,
  }),
  services: Object.freeze({
    user: Object.freeze({
      uri:
        process.env.USER_SERVICE_URI ??
        `http://${userServiceHost}:${userServicePort}`,
    }),
  }),
});
