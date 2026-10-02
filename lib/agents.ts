import type { AgentDef } from "./types";

export const AGENTS: AgentDef[] = [
  {
    id: "atlas",
    name: "Atlas",
    role: "Coordinator",
    mandate: "Split the night, keep the brief, and close with one page Kenny can read in the morning.",
    accent: "#e7a35a",
    bay: "01",
    tools: [
      { id: "delegate", label: "Delegate", blurb: "Slip a task to another bay. Stays in-process." },
      { id: "summarize", label: "Summarize", blurb: "Fold bay reports into one brief." },
      { id: "note", label: "Note", blurb: "Pin a standing order in this bay only." },
    ],
  },
  {
    id: "scout",
    name: "Scout",
    role: "Research",
    mandate: "Find the angle. Read this bay's memory. Never pretend a browser on a VM did the work.",
    accent: "#6ec8c3",
    bay: "02",
    tools: [
      { id: "search", label: "Search", blurb: "Look through local notes. No live web call." },
      { id: "read", label: "Read", blurb: "Open a pinned note in this bay." },
      { id: "note", label: "Note", blurb: "File a finding where only Scout can see it." },
    ],
  },
  {
    id: "quill",
    name: "Quill",
    role: "Writer",
    mandate: "Draft the words someone would actually post. Short, specific, no hype vocabulary.",
    accent: "#e59aab",
    bay: "03",
    tools: [
      { id: "draft", label: "Draft", blurb: "Hold copy in the bay. Nothing is published." },
      { id: "revise", label: "Revise", blurb: "Tighten a line already in memory." },
      { id: "note", label: "Note", blurb: "Pin the line worth protecting." },
    ],
  },
  {
    id: "pulse",
    name: "Pulse",
    role: "Analyst",
    mandate: "Put numbers next to the claim. Label every figure as bay memory, not a live pull.",
    accent: "#c5d67a",
    bay: "04",
    tools: [
      { id: "metrics", label: "Metrics", blurb: "Read the stub table stored in this bay." },
      { id: "compare", label: "Compare", blurb: "Set two stories against each other." },
      { id: "note", label: "Note", blurb: "Pin the comparison Kenny should trust." },
    ],
  },
  {
    id: "relay",
    name: "Relay",
    role: "Comms",
    mandate: "Leave a send-ready note. Do not send it. Kenny pastes when he wants.",
    accent: "#8eb7e0",
    bay: "05",
    tools: [
      { id: "compose", label: "Compose", blurb: "Write the note. The outbox is a stub." },
      { id: "schedule", label: "Schedule", blurb: "Mark a time. No calendar is connected." },
      { id: "note", label: "Note", blurb: "Keep the letter in this bay." },
    ],
  },
];

export const AGENT_IDS = AGENTS.map((agent) => agent.id);

export const WORKER_IDS = ["scout", "quill", "pulse", "relay"] as const;

export const PROMPTS = [
  "Prep a quieter Friday drop for operators who ship at night.",
  "What should this bay remember about the audience?",
  "Turn the morning brief into a Monday checklist.",
];

const byId = new Map(AGENTS.map((agent) => [agent.id, agent]));

export function getAgent(id: string): AgentDef | undefined {
  return byId.get(id);
}
