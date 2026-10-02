import type { Kind, PlannedRun, Stat } from "./types";

const KINDS = new Set<Kind>(["brief", "draft", "findings", "metrics", "letter", "log"]);

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asStats(value: unknown): Stat[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const stats: Stat[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    const label = asString(record.label);
    const statValue = asString(record.value);
    if (label && statValue) stats.push({ label, value: statValue });
    if (stats.length === 4) break;
  }
  return stats.length ? stats : undefined;
}

export function parseModelPayload(raw: string): PlannedRun {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1] ?? raw;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  const fallback = raw.trim() || "The bay returned an empty slip.";

  if (start === -1 || end <= start) {
    return { title: "Bay note", kind: "log", traces: [], reply: fallback };
  }

  try {
    const json = JSON.parse(candidate.slice(start, end + 1)) as Record<string, unknown>;
    const traces = Array.isArray(json.traces)
      ? json.traces.flatMap((item) => {
          if (!item || typeof item !== "object") return [];
          const record = item as Record<string, unknown>;
          const tool = asString(record.tool);
          const input = asString(record.input);
          const output = asString(record.output);
          if (!tool || !input || !output) return [];
          return [{ tool, input, output }];
        }).slice(0, 4)
      : [];

    const reply = asString(json.reply) ?? fallback;
    const title = asString(json.title) ?? "Bay note";
    const kindValue = asString(json.kind);
    const kind: Kind = kindValue && KINDS.has(kindValue as Kind) ? (kindValue as Kind) : "log";
    const noteTitle = json.note && typeof json.note === "object" ? asString((json.note as Record<string, unknown>).title) : null;
    const noteBody = json.note && typeof json.note === "object" ? asString((json.note as Record<string, unknown>).body) : null;

    return {
      title,
      kind,
      traces,
      reply,
      stats: asStats(json.stats),
      note: noteTitle && noteBody ? { title: noteTitle, body: noteBody } : undefined,
    };
  } catch {
    return { title: "Bay note", kind: "log", traces: [], reply: fallback };
  }
}
