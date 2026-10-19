import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

function readWorkflow(fileName: string) {
  return JSON.parse(readFileSync(resolve(process.cwd(), "n8n/workflows", fileName), "utf8"));
}

describe("scheduled n8n insight workflows", () => {
  it.each([
    ["daily-journal-insight.json", 23, 30, "journal_entries"],
    ["daily-routine-insight.json", 23, 40, "routine_daily_reviews"],
  ])("validates %s", (fileName, hour, minute, table) => {
    const workflow = readWorkflow(fileName);
    const schedule = workflow.nodes.find((node: { type: string }) => node.type === "n8n-nodes-base.scheduleTrigger");
    const tableNodes = workflow.nodes.filter((node: { type: string }) => node.type === "n8n-nodes-base.supabase");

    expect(workflow.active).toBe(false);
    expect(workflow.settings.timezone).toBe("Asia/Seoul");
    expect(schedule.parameters.rule.interval[0]).toMatchObject({ triggerAtHour: hour, triggerAtMinute: minute });
    expect(tableNodes).toHaveLength(2);
    expect(tableNodes.every((node: { parameters: { tableId: string } }) => node.parameters.tableId === table)).toBe(true);
    expect(JSON.stringify(workflow)).toContain("REPLACE_WITH_N8N_CREDENTIAL");
  });
});
