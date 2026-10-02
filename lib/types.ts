export type Kind = "brief" | "draft" | "findings" | "metrics" | "letter" | "log";

export type Stat = { label: string; value: string };

export type Trace = {
  id: string;
  tool: string;
  input: string;
  output: string;
};

export type Turn = {
  id: string;
  role: "user" | "agent" | "system";
  at: string;
  body: string;
  title?: string;
  kind: Kind;
  traces: Trace[];
  stats?: Stat[];
  streaming?: boolean;
  via?: "mock" | "live";
};

export type Note = {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  at: string;
};

export type BayState = {
  status: "idle" | "working";
  turns: Turn[];
  notes: Note[];
};

export type ToolDef = {
  id: string;
  label: string;
  blurb: string;
};

export type AgentDef = {
  id: string;
  name: string;
  role: string;
  mandate: string;
  accent: string;
  bay: string;
  tools: ToolDef[];
};

export type Report = {
  agentId: string;
  name: string;
  reply: string;
};

export type PlannedRun = {
  title: string;
  kind: Kind;
  traces: { tool: string; input: string; output: string }[];
  reply: string;
  stats?: Stat[];
  note?: { title: string; body: string };
};

export type RunMode = "mock" | "live";

export type ProviderName = "anthropic" | "openrouter";
