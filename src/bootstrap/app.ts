import { createErrorHandler } from "@presentation/rest/middleware/errorHandler";
import cookieParser from "cookie-parser";
import express, { type Router } from "express";
import type { Logger } from "pino";
import pinoHttp from "pino-http";

const IGNORED_PATHS = new Set(["/health", "/metrics"]);

export function createApp(
	mainRouter: Router,
	logger: Logger,
): ReturnType<typeof express> {
	const app = express();

	app.set("trust proxy", 1);

	app.use(
		pinoHttp({
			logger: logger.child({ component: "HTTP" }),
			customLogLevel: (_req, res, err) => {
				if (res.statusCode >= 500 || err) return "error";
				if (res.statusCode >= 400) return "warn";
				return "info";
			},
			autoLogging: {
				ignore: (req) => IGNORED_PATHS.has(req.url ?? ""),
			},
		}),
	);

	app.use(express.json());
	app.use(cookieParser());

	app.use(mainRouter);
	app.use(createErrorHandler(logger.child({ component: "ErrorHandler" })));

	return app;
}
