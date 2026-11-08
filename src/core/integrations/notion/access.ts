import "server-only";
import { getServerEnv } from "@/core/config/server-env";

export function isNotionBetaUser(userId: string) {
  const configured = getServerEnv().NOTION_BETA_USER_IDS;
  return Boolean(configured?.split(",").map((value) => value.trim()).filter(Boolean).includes(userId));
}

export function requireNotionBetaUser(userId: string) {
  if (!isNotionBetaUser(userId)) throw new Error("NOTION_BETA_FORBIDDEN");
}
