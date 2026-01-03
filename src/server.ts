import mongoose from "mongoose";
import { initDependencies } from "./dependencies";
import { createApp } from "./app";

const PORT = parseInt(process.env.PORT || "3000");
const MONGO_URI =
  process.env.MONGO_URI ||
  `mongodb://${process.env.MONGODB_HOST}:${process.env.MONGODB_PORT}/${process.env.MONGO_DB}`;

const startServer = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    const dependencies = initDependencies();
    const app = createApp(dependencies);
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Fatal Error during startup:", error);
    process.exit(1);
  }
};

startServer();
