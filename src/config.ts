import dotenv from "dotenv";
dotenv.config();

const envInt = (key: string, def: number): number => {
  const num = parseInt(process.env[key] || "", 10);
  return Number.isFinite(num) ? num : def;
};

const mongoUri =
  process.env.MONGO_URI ??
  `mongodb://${process.env.MONGODB_HOST ?? "localhost"}:${envInt("MONGODB_PORT", 27017)}/${process.env.MONGO_DB ?? "alerts"}`;

const userServiceUri =
  process.env.USER_SERVICE_URI ??
  `http://${process.env.USER_SERVICE_HOST ?? "user-service"}:${envInt("USER_SERVICE_PORT", 3004)}`;

export const config = {
  server: {
    port: envInt("PORT", 3000),
  },
  db: {
    uri: mongoUri,
  },
  services: {
    user: {
      uri: userServiceUri,
    },
  },
} as const;
