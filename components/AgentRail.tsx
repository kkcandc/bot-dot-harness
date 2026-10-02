import { AGENTS } from "@/lib/agents";
import type { BayState } from "@/lib/types";

function presence(bay: BayState | undefined): "working" | "sealed" | "clear" {
  if (bay?.status === "working") return "working";
  if (bay?.turns.some((turn) => turn.role === "agent")) return "sealed";
  return "clear";
}

const presenceLabel = {
  working: "Working",
  sealed: "Sealed",
  clear: "Clear",
} as const;

export function AgentRail({
  bays,
  focusedId,
  onFocus,
}: {
  bays: Record<string, BayState>;
  focusedId: string;
  onFocus: (id: string) => void;
}) {
  return (
    <nav className="rail" aria-label="Bays">
      <p className="rail-label">Workers</p>
      <div className="bay-list">
        {AGENTS.map((agent) => {
          const bay = bays[agent.id];
          const state = presence(bay);
          const notes = bay?.notes.length ?? 0;
          return (
            <button
              key={agent.id}
              type="button"
              className={agent.id === focusedId ? "bay is-on" : "bay"}
              style={{ "--accent": agent.accent } as React.CSSProperties}
              aria-pressed={agent.id === focusedId}
              onClick={() => onFocus(agent.id)}
            >
              <span className={`presence is-${state}`} aria-hidden="true" />
              <span>
                <span className="bay-name">
                  <strong>{agent.name}</strong>
                  <span>Bay {agent.bay}</span>
                </span>
                <small>
                  {agent.role} · {presenceLabel[state]} · {notes} {notes === 1 ? "note" : "notes"}
                </small>
              </span>
            </button>
          );
        })}
      </div>
      <p className="scope-note">In-process sandboxes. Tool calls are stubs. Nothing on this desk is a virtual machine.</p>
    </nav>
  );
}
