import { AGENT_IDS } from "./agents";
import { createBays } from "./seed";
import type { BayState, Note, Turn } from "./types";

export const STORAGE_KEY = "harness.cockpit.v1";

export type PersistedCockpit = {
  v: 1;
  focusedId: string;
  bays: Record<string, { turns: Turn[]; notes: Note[] }>;
};

function isTurn(value: unknown): value is Turn {
  if (!value || typeof value !== "object") return false;
  const turn = value as Turn;
  return typeof turn.id === "string" && typeof turn.body === "string" && Array.isArray(turn.traces);
}

function isNote(value: unknown): value is Note {
  if (!value || typeof value !== "object") return false;
  const note = value as Note;
  return typeof note.id === "string" && typeof note.title === "string" && typeof note.body === "string";
}

export function serializeCockpit(focusedId: string, bays: Record<string, BayState>): PersistedCockpit {
  const slim: PersistedCockpit["bays"] = {};
  for (const id of AGENT_IDS) {
    const bay = bays[id];
    if (!bay) continue;
    slim[id] = {
      turns: bay.turns.map((turn) => ({ ...turn, streaming: false })),
      notes: bay.notes,
    };
  }
  return { v: 1, focusedId, bays: slim };
}

export function hydrateCockpit(raw: string): { focusedId: string; bays: Record<string, BayState> } | null {
  try {
    const parsed = JSON.parse(raw) as Partial<PersistedCockpit>;
    if (parsed.v !== 1 || !parsed.bays) return null;
    const bays = createBays();
    for (const id of AGENT_IDS) {
      const saved = parsed.bays[id];
      if (!saved) continue;
      const turns = Array.isArray(saved.turns) ? saved.turns.filter(isTurn).slice(-40) : [];
      const notes = Array.isArray(saved.notes) ? saved.notes.filter(isNote).slice(-30) : [];
      if (turns.length === 0 && notes.length === 0) continue;
      bays[id] = {
        status: "idle",
        turns: turns.length ? turns : bays[id].turns,
        notes: notes.length ? notes : bays[id].notes,
      };
    }
    const focusedId = typeof parsed.focusedId === "string" && AGENT_IDS.includes(parsed.focusedId) ? parsed.focusedId : "atlas";
    return { focusedId, bays };
  } catch {
    return null;
  }
}
