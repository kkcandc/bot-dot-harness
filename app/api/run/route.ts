import { getAgent } from "@/lib/agents";
import { planLiveRun } from "@/lib/live";
import { planMockRun } from "@/lib/plan";
import { liveProvider } from "@/lib/provider";
import { encodeEvent, writePlannedRun } from "@/lib/stream";
import type { Note, Report, RunMode } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RunBody = {
  agentId?: string;
  message?: string;
  mode?: RunMode;
  notes?: Note[];
  reports?: Report[];
};

function asNotes(value: unknown): Note[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const note = item as Note;
    if (typeof note.title !== "string" || typeof note.body !== "string") return [];
    return [{ id: note.id ?? "note", title: note.title, body: note.body, pinned: Boolean(note.pinned), at: note.at ?? "" }];
  }).slice(0, 8);
}

function asReports(value: unknown): Report[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const reports = value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const report = item as Report;
    if (typeof report.agentId !== "string" || typeof report.name !== "string" || typeof report.reply !== "string") return [];
    return [{ agentId: report.agentId, name: report.name, reply: report.reply }];
  });
  return reports.length ? reports : undefined;
}

export async function POST(request: Request) {
  let body: RunBody;
  try {
    body = (await request.json()) as RunBody;
  } catch {
    return Response.json({ error: "Send a JSON body." }, { status: 400 });
  }

  const agentId = body.agentId ?? "";
  const message = body.message?.trim() ?? "";
  const agent = getAgent(agentId);
  if (!agent) return Response.json({ error: "Unknown bay." }, { status: 400 });
  if (!message) return Response.json({ error: "Say what the bay should do." }, { status: 400 });
  if (message.length > 4000) return Response.json({ error: "Keep the dispatch under 4000 characters." }, { status: 400 });

  const mode: RunMode = body.mode === "live" ? "live" : "mock";
  const notes = asNotes(body.notes);
  const reports = asReports(body.reports);
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: Parameters<typeof encodeEvent>[0], data: Parameters<typeof encodeEvent>[1]) => {
        controller.enqueue(encoder.encode(encodeEvent(event, data)));
      };
      try {
        if (mode === "live") {
          const provider = liveProvider();
          if (!provider) {
            send("error", { message: "No OpenRouter or Claude key is configured. Stay in mock." });
            send("done", {});
            return;
          }
          const plan = await planLiveRun({ provider, agentId, message, notes, reports });
          await writePlannedRun(send, plan, true);
          return;
        }
        const plan = planMockRun(agentId, message, reports);
        await writePlannedRun(send, plan, true);
      } catch (error) {
        const messageText = error instanceof Error ? error.message : "The bay failed.";
        send("error", { message: messageText });
        send("done", {});
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
