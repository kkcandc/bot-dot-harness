"use client";

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { AgentRail } from "@/components/AgentRail";
import { SidePane } from "@/components/SidePane";
import { Stage } from "@/components/Stage";
import { AGENTS, getAgent, WORKER_IDS } from "@/lib/agents";
import { consumeSse } from "@/lib/consume-sse";
import { clock, uid } from "@/lib/id";
import { createBays } from "@/lib/seed";
import { hydrateCockpit, serializeCockpit, STORAGE_KEY } from "@/lib/storage";
import type { BayState, Kind, ProviderName, Report, RunMode, Stat, Trace, Turn } from "@/lib/types";

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function patchBay(setBays: Dispatch<SetStateAction<Record<string, BayState>>>, agentId: string, recipe: (bay: BayState) => BayState) {
  setBays((current) => {
    const bay = current[agentId];
    if (!bay) return current;
    return { ...current, [agentId]: recipe(bay) };
  });
}

export function Cockpit() {
  const [bays, setBays] = useState<Record<string, BayState>>(createBays);
  const [focusedId, setFocusedId] = useState("atlas");
  const [draft, setDraft] = useState("");
  const [mode, setMode] = useState<RunMode>("mock");
  const [provider, setProvider] = useState<ProviderName | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const baysRef = useRef(bays);
  const runLock = useRef(false);
  baysRef.current = bays;

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const hydrated = hydrateCockpit(raw);
      if (hydrated) {
        setBays(hydrated.bays);
        setFocusedId(hydrated.focusedId);
      }
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (Object.values(bays).some((bay) => bay.status === "working")) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeCockpit(focusedId, bays)));
  }, [bays, focusedId, ready]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/status")
      .then((response) => response.json())
      .then((data: { provider?: ProviderName | null }) => {
        if (!cancelled) setProvider(data.provider ?? null);
      })
      .catch(() => {
        if (!cancelled) setProvider(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const agent = getAgent(focusedId) ?? AGENTS[0];
  const bay = bays[agent.id] ?? { status: "idle" as const, turns: [], notes: [] };
  const working = Object.values(bays).filter((item) => item.status === "working").length;

  async function execute(agentId: string, message: string, reports?: Report[]): Promise<string> {
    const turnId = uid("turn");
    const notes = baysRef.current[agentId]?.notes ?? [];
    let reply = "";

    patchBay(setBays, agentId, (current) => ({
      ...current,
      status: "working",
      turns: [
        ...current.turns,
        { id: uid("user"), role: "user", at: clock(), body: message, kind: "log", traces: [] },
        {
          id: turnId,
          role: "agent",
          at: clock(),
          title: "Working",
          body: "",
          kind: "log",
          traces: [],
          streaming: true,
          via: mode,
        },
      ],
    }));

    try {
      const response = await fetch("/api/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ agentId, message, mode, notes, reports }),
      });

      await consumeSse(response, (event, data) => {
      if (event === "meta") {
        const meta = data as { title?: string; kind?: Kind; stats?: Stat[] };
        patchBay(setBays, agentId, (current) => ({
          ...current,
          turns: current.turns.map((turn) =>
            turn.id === turnId ? { ...turn, title: meta.title ?? turn.title, kind: meta.kind ?? turn.kind, stats: meta.stats } : turn,
          ),
        }));
      } else if (event === "trace") {
        const trace = data as Omit<Trace, "id">;
        const next: Trace = { id: uid("trace"), tool: trace.tool, input: trace.input, output: trace.output };
        patchBay(setBays, agentId, (current) => ({
          ...current,
          turns: current.turns.map((turn) => (turn.id === turnId ? { ...turn, traces: [...turn.traces, next] } : turn)),
        }));
      } else if (event === "token") {
        const text = (data as { text?: string }).text ?? "";
        reply += text;
        patchBay(setBays, agentId, (current) => ({
          ...current,
          turns: current.turns.map((turn) => (turn.id === turnId ? { ...turn, body: turn.body + text } : turn)),
        }));
      } else if (event === "note") {
        const note = data as { title?: string; body?: string };
        if (!note.title || !note.body) return;
        patchBay(setBays, agentId, (current) => ({
          ...current,
          notes: [{ id: uid("note"), title: note.title ?? "Note", body: note.body ?? "", pinned: true, at: clock() }, ...current.notes],
        }));
      } else if (event === "error") {
        const messageText = (data as { message?: string }).message ?? "The bay failed.";
        setError(messageText);
        patchBay(setBays, agentId, (current) => ({
          ...current,
          turns: current.turns.map((turn) => (turn.id === turnId && turn.body.length === 0 ? { ...turn, body: messageText, title: "Blocked" } : turn)),
        }));
      } else if (event === "done") {
        patchBay(setBays, agentId, (current) => ({
          ...current,
          status: "idle",
          turns: current.turns.map((turn) => (turn.id === turnId ? { ...turn, streaming: false } : turn)),
        }));
      }
      });
    } catch (caught) {
      const messageText = caught instanceof Error ? caught.message : "The bay failed.";
      setError(messageText);
      patchBay(setBays, agentId, (current) => ({
        ...current,
        status: "idle",
        turns: current.turns.map((turn) =>
          turn.id === turnId ? { ...turn, streaming: false, title: turn.body ? turn.title : "Blocked", body: turn.body || messageText } : turn,
        ),
      }));
    }

    return reply;
  }

  async function runFocused() {
    const message = draft.trim();
    if (!message || runLock.current) return;
    if (mode === "live" && !provider) {
      setError("No OpenRouter or Claude key is configured. Stay in mock.");
      return;
    }
    runLock.current = true;
    setDraft("");
    setError(null);
    try {
      await execute(focusedId, message);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The bay failed.");
    } finally {
      runLock.current = false;
    }
  }

  async function fanOut() {
    const message = draft.trim();
    if (!message || runLock.current) return;
    if (mode === "live" && !provider) {
      setError("No OpenRouter or Claude key is configured. Stay in mock.");
      return;
    }
    runLock.current = true;
    setDraft("");
    setError(null);
    setFocusedId("atlas");
    patchBay(setBays, "atlas", (current) => ({
      ...current,
      status: "working",
      turns: [
        ...current.turns,
        {
          id: uid("sys"),
          role: "system",
          at: clock(),
          kind: "log",
          traces: [],
          body: "Bays are out. Atlas is holding the desk.",
        },
      ],
    }));
    try {
      const replies = await Promise.all(WORKER_IDS.map((id, index) => wait(index * 280).then(() => execute(id, message))));
      const reports: Report[] = WORKER_IDS.map((id, index) => ({
        agentId: id,
        name: getAgent(id)?.name ?? id,
        reply: replies[index] ?? "",
      }));
      await execute("atlas", message, reports);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The night failed.");
      patchBay(setBays, "atlas", (current) => ({ ...current, status: "idle" }));
    } finally {
      runLock.current = false;
    }
  }

  function restore() {
    if (runLock.current) return;
    setBays(createBays());
    setFocusedId("atlas");
    setDraft("");
    setError(null);
    setMode("mock");
    window.localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <div className="cockpit">
      <header className="top">
        <div className="brand">
          <span className="mark" aria-hidden="true">
            {AGENTS.map((item) => (
              <i key={item.id} className={bays[item.id]?.status === "working" ? "is-hot" : ""} style={{ background: item.accent }} />
            ))}
          </span>
          <div>
            <h1>Harness</h1>
            <p>Bot / Dot overnight cockpit</p>
          </div>
        </div>
        <div className="chips-top">
          <span className={mode === "live" ? "pill is-live" : "pill is-mock"}>
            <span className="dot" aria-hidden="true" />
            <strong>{mode === "live" ? `Live · ${provider}` : "Mock"}</strong>
          </span>
          <span className="pill">
            <strong>0 VMs</strong>
          </span>
          <span className="pill">
            <strong>{working > 0 ? `${working} working` : "5 bays"}</strong>
          </span>
        </div>
        <div className="top-actions">
          <button type="button" className="ghost" onClick={restore} disabled={working > 0}>
            Restore last night
          </button>
        </div>
      </header>
      <div className="deck">
        <AgentRail bays={bays} focusedId={agent.id} onFocus={setFocusedId} />
        <Stage
          agent={agent}
          bay={bay}
          draft={draft}
          mode={mode}
          liveReady={provider !== null}
          busy={working > 0}
          error={error}
          onDraft={setDraft}
          onMode={setMode}
          onRun={() => {
            void runFocused();
          }}
          onFanout={() => {
            void fanOut();
          }}
        />
        <SidePane
          agent={agent}
          bay={bay}
          busy={working > 0}
          onAddNote={(title, body) => {
            patchBay(setBays, agent.id, (current) => ({
              ...current,
              notes: [{ id: uid("note"), title, body, pinned: false, at: clock() }, ...current.notes],
            }));
          }}
          onDeleteNote={(id) => {
            patchBay(setBays, agent.id, (current) => ({ ...current, notes: current.notes.filter((note) => note.id !== id) }));
          }}
          onTogglePin={(id) => {
            patchBay(setBays, agent.id, (current) => ({
              ...current,
              notes: current.notes.map((note) => (note.id === id ? { ...note, pinned: !note.pinned } : note)),
            }));
          }}
        />
      </div>
    </div>
  );
}
