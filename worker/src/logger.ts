import pino from "pino";
import { cfg } from "./config.js";

export const logger = pino({
  level: cfg.logLevel,
  transport: process.stdout.isTTY
    ? { target: "pino-pretty", options: { colorize: true, translateTime: "HH:MM:ss" } }
    : undefined,
});
