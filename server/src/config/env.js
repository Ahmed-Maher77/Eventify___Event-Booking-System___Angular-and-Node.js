import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRootEnv = path.join(__dirname, "..", "..", ".env");

if (fs.existsSync(serverRootEnv)) {
  dotenv.config({ path: serverRootEnv });
} else {
  dotenv.config();
}
