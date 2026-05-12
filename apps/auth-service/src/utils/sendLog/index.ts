import fs from "fs";
import path from "path";

type LogType = "info" | "success" | "warn" | "error" | "debug";

interface LogPayload {
  type: LogType;
  message: string;
  source: string;
}

const LOG_LEVEL_MAP: Record<LogType, string> = {
  debug:   "DEBUG",
  info:    "INFO",
  success: "OK",
  warn:    "WARN",
  error:   "ERROR",
};

const LOG_FILE = path.join(process.cwd(), "logs", "app.log");

function writeToFile(line: string) {
  fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
  fs.appendFileSync(LOG_FILE, line + "\n", "utf8");
}

export function sendLog({ type, message, source }: LogPayload): void {
  const timestamp = new Date().toISOString();
  const level = LOG_LEVEL_MAP[type];

  const line = `${timestamp} [${level}] [${source}] ${message}`;

  console.log(line);
  writeToFile(line);
}