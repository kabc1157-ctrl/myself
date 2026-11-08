import "server-only";
import { createHash, randomBytes } from "node:crypto";

export function createRoutineWidgetToken() {
  const token = `iew_${randomBytes(32).toString("base64url")}`;
  return { token, hash: hashRoutineWidgetToken(token) };
}

export function hashRoutineWidgetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
