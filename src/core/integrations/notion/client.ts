import "server-only";

const NOTION_VERSION = "2022-06-28";

async function notionRequest<T>(token: string, path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`https://api.notion.com/v1${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Notion-Version": NOTION_VERSION, "Content-Type": "application/json", ...(init?.headers ?? {}) },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Notion API ${response.status}: ${await response.text()}`);
  return response.json() as Promise<T>;
}

export type NotionSearchResult = { object: string; id: string; title?: Array<{ plain_text?: string }>; properties?: Record<string, { id?: string; type?: string; name?: string }> };
export type NotionPage = { id: string; last_edited_time?: string; properties: Record<string, { type?: string; title?: Array<{ plain_text?: string }>; rich_text?: Array<{ plain_text?: string }>; checkbox?: boolean; date?: { start?: string | null; end?: string | null } }> };

export function searchNotion(token: string, query: string) {
  return notionRequest<{ results: NotionSearchResult[] }>(token, "/search", { method: "POST", body: JSON.stringify({ query, page_size: 100 }) });
}

type NotionBlock = { id: string; type?: string; has_children?: boolean; child_database?: { title?: string } };

export async function findChildDatabases(token: string, rootIds: string[], depth = 0): Promise<NotionSearchResult[]> {
  if (depth > 4 || !rootIds.length) return [];
  const found: NotionSearchResult[] = [];
  for (const rootId of rootIds) {
    const response = await notionRequest<{ results: NotionBlock[] }>(token, `/blocks/${rootId}/children?page_size=100`);
    const childIds: string[] = [];
    for (const block of response.results) {
      if (block.type === "child_database") {
        found.push({ object: "database", id: block.id, title: block.child_database?.title ? [{ plain_text: block.child_database.title }] : undefined });
      }
      if (block.has_children && block.type !== "child_database") childIds.push(block.id);
    }
    found.push(...await findChildDatabases(token, childIds, depth + 1));
  }
  return found;
}

export function getNotionDatabase(token: string, id: string) {
  return notionRequest<{ id: string; properties: Record<string, { id: string; type: string; name: string }> }>(token, `/databases/${id}`);
}

export function queryNotionDatabase(token: string, id: string) {
  return notionRequest<{ results: NotionPage[] }>(token, `/databases/${id}/query`, { method: "POST", body: JSON.stringify({ page_size: 100, sorts: [{ timestamp: "last_edited_time", direction: "descending" }] }) });
}

export function updateNotionPage(token: string, id: string, properties: Record<string, unknown>) {
  return notionRequest<NotionPage>(token, `/pages/${id}`, { method: "PATCH", body: JSON.stringify({ properties }) });
}
