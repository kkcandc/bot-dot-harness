import type { PlannedRun } from "./types";

export type RunEvent =
  | { event: "meta"; data: Pick<PlannedRun, "title" | "kind" | "stats"> }
  | { event: "trace"; data: PlannedRun["traces"][number] }
  | { event: "token"; data: { text: string } }
  | { event: "note"; data: { title: string; body: string } }
  | { event: "error"; data: { message: string } }
  | { event: "done"; data: Record<string, never> };

export function encodeEvent(event: RunEvent["event"], data: RunEvent["data"]): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export function chunkReply(text: string): string[] {
  const parts = text.split(/(\s+)/);
  const chunks: string[] = [];
  let buffer = "";
  for (const part of parts) {
    buffer += part;
    if (buffer.length >= 24) {
      chunks.push(buffer);
      buffer = "";
    }
  }
  if (buffer) chunks.push(buffer);
  return chunks.length ? chunks : [text];
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function writePlannedRun(
  send: (event: RunEvent["event"], data: RunEvent["data"]) => void,
  plan: PlannedRun,
  paced: boolean,
): Promise<void> {
  send("meta", { title: plan.title, kind: plan.kind, stats: plan.stats });
  for (const trace of plan.traces) {
    if (paced) await sleep(280);
    send("trace", trace);
  }
  for (const text of chunkReply(plan.reply)) {
    if (paced) await sleep(22);
    send("token", { text });
  }
  if (plan.note) {
    if (paced) await sleep(120);
    send("note", plan.note);
  }
  send("done", {});
}
