import { useState } from "react";
import type { AgentDef, BayState } from "@/lib/types";

function NoteForm({ disabled, onAdd }: { disabled: boolean; onAdd: (title: string, body: string) => void }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  return (
    <form
      className="note-form"
      onSubmit={(event) => {
        event.preventDefault();
        const nextTitle = title.trim();
        const nextBody = body.trim();
        if (!nextTitle || !nextBody) return;
        onAdd(nextTitle, nextBody);
        setTitle("");
        setBody("");
      }}
    >
      <label className="sr" htmlFor="note-title">
        Note title
      </label>
      <input id="note-title" value={title} placeholder="Title" onChange={(event) => setTitle(event.target.value)} />
      <label className="sr" htmlFor="note-body">
        Note body
      </label>
      <textarea id="note-body" value={body} placeholder="Only this bay will remember it" onChange={(event) => setBody(event.target.value)} />
      <button className="ghost" type="submit" disabled={disabled || title.trim().length === 0 || body.trim().length === 0}>
        Save in this bay
      </button>
    </form>
  );
}

export function SidePane({
  agent,
  bay,
  busy,
  onAddNote,
  onDeleteNote,
  onTogglePin,
}: {
  agent: AgentDef;
  bay: BayState;
  busy: boolean;
  onAddNote: (title: string, body: string) => void;
  onDeleteNote: (id: string) => void;
  onTogglePin: (id: string) => void;
}) {
  const used = new Set(bay.turns.filter((turn) => turn.role === "agent").flatMap((turn) => turn.traces.map((trace) => trace.tool)).slice(-6));
  const notes = [...bay.notes].sort((a, b) => Number(b.pinned) - Number(a.pinned));

  return (
    <aside className="side" style={{ "--accent": agent.accent } as React.CSSProperties}>
      <section>
        <p className="side-label">Memory · {agent.name}</p>
        <NoteForm disabled={busy} onAdd={onAddNote} />
        <ul className="note-list">
          {notes.map((note) => (
            <li key={note.id} className={note.pinned ? "note is-pinned" : "note"}>
              <header>
                <h3>{note.title}</h3>
                <div className="note-actions">
                  <button type="button" onClick={() => onTogglePin(note.id)}>
                    {note.pinned ? "Unpin" : "Pin"}
                  </button>
                  <button type="button" onClick={() => onDeleteNote(note.id)} aria-label={`Remove ${note.title}`}>
                    Remove
                  </button>
                </div>
              </header>
              <p>{note.body}</p>
              <time dateTime={note.at}>{note.at}</time>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <p className="side-label">Tools · stubs</p>
        <ul className="tool-list">
          {agent.tools.map((tool) => (
            <li key={tool.id} className="tool">
              <strong>{tool.label}</strong>
              <small>{used.has(tool.id) ? "Used in this bay" : "Idle"}</small>
              <small>{tool.blurb}</small>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <p className="side-label">Bay {agent.bay}</p>
        <ul className="plate">
          <li>
            <span>Sandbox</span>
            <b>In-process</b>
          </li>
          <li>
            <span>Machine</span>
            <b>None</b>
          </li>
          <li>
            <span>Tools</span>
            <b>Stubs</b>
          </li>
          <li>
            <span>Memory</span>
            <b>This bay only</b>
          </li>
          <li>
            <span>Load</span>
            <span className={bay.status === "working" ? "bars is-on" : "bars"} aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
            </span>
          </li>
        </ul>
      </section>
    </aside>
  );
}
