import { useEffect, useRef } from "react";
import { PROMPTS } from "@/lib/agents";
import type { AgentDef, BayState, RunMode, Turn } from "@/lib/types";

function latestAgentTurn(turns: Turn[]): Turn | undefined {
  for (let index = turns.length - 1; index >= 0; index -= 1) {
    if (turns[index]?.role === "agent") return turns[index];
  }
  return undefined;
}

function kicker(turn: Turn, agent: AgentDef): string {
  if (turn.streaming) return `${agent.name} is writing`;
  const via = turn.via === "live" ? "Live" : turn.via === "mock" ? "Mock" : "Last night";
  return `${agent.role} · ${turn.at} · ${via}`;
}

export function Stage({
  agent,
  bay,
  draft,
  mode,
  liveReady,
  busy,
  error,
  onDraft,
  onMode,
  onRun,
  onFanout,
}: {
  agent: AgentDef;
  bay: BayState;
  draft: string;
  mode: RunMode;
  liveReady: boolean;
  busy: boolean;
  error: string | null;
  onDraft: (value: string) => void;
  onMode: (mode: RunMode) => void;
  onRun: () => void;
  onFanout: () => void;
}) {
  const hero = latestAgentTurn(bay.turns);
  const heroIndex = hero ? bay.turns.findIndex((turn) => turn.id === hero.id) : -1;
  const earlier = heroIndex >= 0 ? bay.turns.slice(0, heroIndex) : bay.turns;
  const canSend = draft.trim().length > 0 && !busy;
  const sheetRef = useRef<HTMLElement>(null);

  useEffect(() => {
    sheetRef.current?.scrollTo({ top: 0 });
  }, [hero?.id]);

  return (
    <section className="stage" aria-label={`${agent.name} desk`}>
      <article
        ref={sheetRef}
        className="sheet"
        data-kind={hero?.kind ?? "log"}
        style={{ "--accent": agent.accent } as React.CSSProperties}
      >
        {hero ? (
          <div aria-live="polite">
            <p className="kicker">{kicker(hero, agent)}</p>
            <h2>{hero.title ?? agent.name}</h2>
            {hero.stats && hero.stats.length > 0 ? (
              <ul className="stats">
                {hero.stats.map((stat) => (
                  <li key={stat.label}>
                    <strong>{stat.value}</strong>
                    <span>{stat.label}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            <p className={hero.streaming ? "hero-body caret" : "hero-body"}>{hero.body}</p>
            {hero.traces.length > 0 ? (
              <div className="traces">
                {hero.traces.map((trace) => (
                  <div className="trace" key={trace.id}>
                    <b>{trace.tool}</b>
                    <p>
                      {trace.input}
                      <small>{trace.output}</small>
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <p className="empty">This bay is clear. Dispatch something.</p>
        )}
        {earlier.length > 0 ? (
          <div className="log">
            <h3>Bay log</h3>
            {earlier.map((turn) =>
              turn.role === "system" ? (
                <p key={turn.id} className="is-system">
                  {turn.at} · {turn.body}
                </p>
              ) : (
                <article key={turn.id}>
                  <header>
                    <span>{turn.role === "user" ? "You" : turn.title ?? agent.name}</span>
                    <span>{turn.at}</span>
                  </header>
                  <p>{turn.body}</p>
                </article>
              ),
            )}
          </div>
        ) : null}
      </article>
      {error ? <p className="banner">{error}</p> : null}
      <form
        className="dock"
        onSubmit={(event) => {
          event.preventDefault();
          onRun();
        }}
      >
        <div>
          <div className="prompt-row">
            {PROMPTS.map((prompt) => (
              <button key={prompt} type="button" className="chip" disabled={busy} onClick={() => onDraft(prompt)}>
                {prompt}
              </button>
            ))}
          </div>
          <label className="sr" htmlFor="dispatch">
            Dispatch to {agent.name}
          </label>
          <textarea
            id="dispatch"
            value={draft}
            placeholder={`Dispatch a task to ${agent.name}…`}
            rows={2}
            onChange={(event) => onDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                event.preventDefault();
                onRun();
              }
            }}
          />
        </div>
        <div className="actions">
          <div className="mode" role="group" aria-label="Run mode">
            <button type="button" className={mode === "mock" ? "is-on" : ""} onClick={() => onMode("mock")}>
              Mock
            </button>
            <button
              type="button"
              className={mode === "live" ? "is-on" : ""}
              disabled={!liveReady}
              title={liveReady ? "Use the configured Claude or OpenRouter key" : "Add ANTHROPIC_API_KEY or OPENROUTER_API_KEY"}
              onClick={() => onMode("live")}
            >
              Live
            </button>
          </div>
          <button className="solid" type="submit" disabled={!canSend}>
            Run this bay
          </button>
          <button className="ghost" type="button" disabled={!canSend} onClick={onFanout}>
            Fan out overnight
          </button>
        </div>
      </form>
    </section>
  );
}
