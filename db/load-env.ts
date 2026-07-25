import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

function parseEnvLine(line: string): [string, string] | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return null;

  const eq = trimmed.indexOf("=");
  if (eq <= 0) return null;

  const key = trimmed.slice(0, eq).trim();
  let value = trimmed.slice(eq + 1).trim();

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }

  return [key, value];
}

function loadEnvFile(path: string) {
  if (!existsSync(path)) return;

  for (const line of readFileSync(path, "utf8").split("\n")) {
    const parsed = parseEnvLine(line);
    if (!parsed) continue;
    const [key, value] = parsed;
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

/** Load `.env.local` / `.env` for CLI scripts (tsx, drizzle-kit). Next.js loads these automatically. */
export function loadLocalEnv() {
  const root = process.cwd();
  for (const name of [".env.local", ".env.development.local", ".env"]) {
    loadEnvFile(resolve(root, name));
  }
}

loadLocalEnv();
