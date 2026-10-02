import { getAgent } from "./agents";
import { clip } from "./id";
import { parseModelPayload } from "./parse";
import { providerKey } from "./provider";
import type { Note, PlannedRun, ProviderName, Report } from "./types";

function memoryBlock(notes: Note[]): string {
  if (notes.length === 0) return "No notes in this bay yet.";
  return notes
    .slice(0, 8)
    .map((note) => `- ${note.title}: ${clip(note.body, 320)}`)
    .join("\n");
}

function reportBlock(reports: Report[] | undefined): string {
  if (!reports?.length) return "No sibling reports.";
  return reports.map((report) => `## ${report.name}\n${clip(report.reply, 500)}`).join("\n\n");
}

export function buildLivePrompt(input: {
  agentId: string;
  message: string;
  notes: Note[];
  reports?: Report[];
}): { system: string; user: string } {
  const agent = getAgent(input.agentId);
  const tools = agent?.tools.map((tool) => `${tool.id} (${tool.blurb})`).join("; ") ?? "note";
  const system = [
    `You are ${agent?.name ?? "a worker"} (${agent?.role ?? "bay"}) inside Harness, a Bot/Dot cockpit.`,
    agent?.mandate ?? "Stay inside your bay.",
    "You do not have a virtual machine. Tools are stubs. Never claim you provisioned infrastructure, sent email, or queried a live system.",
    "Memory you are shown belongs only to this bay.",
    "Reply with JSON only, no markdown fence:",
    '{"title":"short","kind":"brief|draft|findings|metrics|letter|log","traces":[{"tool":"id","input":"...","output":"stub result"}],"reply":"plain text","stats":[{"label":"...","value":"..."}],"note":{"title":"...","body":"..."}}',
    `Allowed tool ids: ${tools}. Use 1 to 3 traces.`,
    "Keep reply under 160 words. Be specific to the user message. Write like a sharp colleague, not a help desk.",
  ].join("\n");

  const user = [
    `Task:\n${input.message.trim()}`,
    `This bay's memory:\n${memoryBlock(input.notes)}`,
    `Sibling reports:\n${reportBlock(input.reports)}`,
  ].join("\n\n");

  return { system, user };
}

async function complete(provider: ProviderName, system: string, user: string): Promise<string> {
  const key = providerKey(provider);
  if (!key) throw new Error("No provider key is configured.");

  if (provider === "anthropic") {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal: AbortSignal.timeout(25000),
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL?.trim() || "claude-sonnet-4-5",
        max_tokens: 1200,
        system,
        messages: [{ role: "user", content: user }],
      }),
    });
    if (!response.ok) {
      const detail = clip(await response.text(), 180);
      throw new Error(`Claude returned ${response.status}. ${detail}`);
    }
    const payload = (await response.json()) as { content?: { type?: string; text?: string }[] };
    const text = payload.content?.map((block) => block.text ?? "").join("\n").trim();
    if (!text) throw new Error("Claude returned an empty message.");
    return text;
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    signal: AbortSignal.timeout(25000),
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${key}`,
      "x-title": "Harness",
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL?.trim() || "anthropic/claude-sonnet-4.5",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!response.ok) {
    const detail = clip(await response.text(), 180);
    throw new Error(`OpenRouter returned ${response.status}. ${detail}`);
  }
  const payload = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  const text = payload.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("OpenRouter returned an empty message.");
  return text;
}

export async function planLiveRun(input: {
  provider: ProviderName;
  agentId: string;
  message: string;
  notes: Note[];
  reports?: Report[];
}): Promise<PlannedRun> {
  const prompt = buildLivePrompt(input);
  const raw = await complete(input.provider, prompt.system, prompt.user);
  return parseModelPayload(raw);
}
