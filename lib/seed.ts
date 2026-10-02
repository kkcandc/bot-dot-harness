import type { BayState, Turn } from "./types";

function turn(partial: Turn): Turn {
  return partial;
}

export const SEED_BAYS: Record<string, BayState> = {
  atlas: {
    status: "idle",
    notes: [
      {
        id: "atlas-order",
        title: "Standing order",
        body: "Close the night with one brief. Do not start machines. Each bay keeps its own memory.",
        pinned: true,
        at: "00:40",
      },
      {
        id: "atlas-owner",
        title: "Morning owner",
        body: "Kenny reviews the desk in the morning. Leave the note. Relay does not send it.",
        pinned: true,
        at: "00:41",
      },
    ],
    turns: [
      turn({
        id: "atlas-user",
        role: "user",
        at: "01:02",
        kind: "log",
        traces: [],
        body: "Overnight: prep Friday's drop. Find the angle, draft the post, pull the numbers, and leave a morning note I can send.",
      }),
      turn({
        id: "atlas-plan",
        role: "agent",
        at: "01:06",
        title: "Desk plan",
        kind: "log",
        body: "Scout takes the angle. Quill takes the post. Pulse takes the numbers. Relay leaves the note. I stay with the brief and I do not start a machine.",
        traces: [
          {
            id: "atlas-t1",
            tool: "delegate",
            input: "Scout — angle for operators who ship at night",
            output: "Slip handed to bay 02. In-process stub. No VM.",
          },
          {
            id: "atlas-t2",
            tool: "delegate",
            input: "Quill — a short post, no hype",
            output: "Slip handed to bay 03. In-process stub. No VM.",
          },
          {
            id: "atlas-t3",
            tool: "delegate",
            input: "Pulse — last three Friday drops",
            output: "Slip handed to bay 04. In-process stub. No VM.",
          },
          {
            id: "atlas-t4",
            tool: "delegate",
            input: "Relay — morning note, send-ready, do not send",
            output: "Slip handed to bay 05. In-process stub. No VM.",
          },
        ],
      }),
      turn({
        id: "atlas-system",
        role: "system",
        at: "02:11",
        kind: "log",
        traces: [],
        body: "Scout, Quill, Pulse, and Relay sealed their bays.",
      }),
      turn({
        id: "atlas-brief",
        role: "agent",
        at: "02:14",
        title: "Morning brief",
        kind: "brief",
        stats: [
          { label: "Bays sealed", value: "4" },
          { label: "Machines started", value: "0" },
          { label: "Note", value: "Ready" },
        ],
        body: "Friday leads with the bay, not the machine.\n\nThe line to ship: “Every worker gets a bay. None of them get a VM.”\n\nQuill’s post is pinned. Pulse has the hold at 1.8× against feature-list copy, from bay memory rather than a live pull. Relay left a morning note you can paste.\n\nFour bays reported. The night is closed.",
        traces: [
          {
            id: "atlas-t5",
            tool: "summarize",
            input: "Fold four bay reports",
            output: "Brief sealed in bay 01. Nothing provisioned.",
          },
        ],
      }),
    ],
  },
  scout: {
    status: "idle",
    notes: [
      {
        id: "scout-audience",
        title: "Audience",
        body: "Operators who ship after midnight. They skim hype and stop when a sentence names a constraint.",
        pinned: true,
        at: "01:18",
      },
      {
        id: "scout-angle",
        title: "Angle",
        body: "Isolation without infra theater. Say bay, not VM. The product is the desk, not a fleet.",
        pinned: true,
        at: "01:22",
      },
    ],
    turns: [
      turn({
        id: "scout-user",
        role: "user",
        at: "01:06",
        kind: "log",
        traces: [],
        body: "Find the angle for Friday’s drop. Operators who ship at night.",
      }),
      turn({
        id: "scout-findings",
        role: "agent",
        at: "01:22",
        title: "The angle",
        kind: "findings",
        body: "Lead with isolation, and refuse the data-center story.\n\nThe room has already heard “agents with their own computers.” What they have not heard is a cockpit that shows the work with zero machines and zero keys.\n\nPhrase that earns the stop: bay. Phrase that burns trust if we fake it: VM.\n\nI read this bay’s notes only. Search was a stub.",
        traces: [
          {
            id: "scout-t1",
            tool: "search",
            input: "night operators × isolation × friday drop",
            output: "3 hits in bay memory. No network call.",
          },
          {
            id: "scout-t2",
            tool: "read",
            input: "memory://audience",
            output: "Pinned note opened inside bay 02.",
          },
          {
            id: "scout-t3",
            tool: "note",
            input: "Pin the angle",
            output: "Note kept in Scout’s memory. Other bays cannot see it.",
          },
        ],
      }),
    ],
  },
  quill: {
    status: "idle",
    notes: [
      {
        id: "quill-post",
        title: "Friday post",
        body: "Your agents do not need a data center.\n\nGive each one a bay: a name, a few tools, a memory that stays put. Scout reads. Quill writes. Pulse counts. Relay leaves the note on the desk. Atlas keeps the night honest.\n\nNo VM per worker. No key required to see it work.\n\nThe cockpit is the product.",
        pinned: true,
        at: "01:41",
      },
      {
        id: "quill-line",
        title: "Line to protect",
        body: "Every worker gets a bay. None of them get a VM.",
        pinned: true,
        at: "01:44",
      },
    ],
    turns: [
      turn({
        id: "quill-user",
        role: "user",
        at: "01:06",
        kind: "log",
        traces: [],
        body: "Draft the Friday post. Short. No hype. Protect one line.",
      }),
      turn({
        id: "quill-draft",
        role: "agent",
        at: "01:44",
        title: "The post",
        kind: "draft",
        body: "Your agents do not need a data center.\n\nGive each one a bay: a name, a few tools, a memory that stays put. Scout reads. Quill writes. Pulse counts. Relay leaves the note on the desk. Atlas keeps the night honest.\n\nNo VM per worker. No key required to see it work.\n\nThe cockpit is the product.",
        traces: [
          {
            id: "quill-t1",
            tool: "draft",
            input: "Friday drop, under 90 words",
            output: "Draft held in bay 03. Nothing published.",
          },
          {
            id: "quill-t2",
            tool: "revise",
            input: "Cut “platform”, “fleet”, and “unlock”",
            output: "Three words removed. Line protected.",
          },
          {
            id: "quill-t3",
            tool: "note",
            input: "Pin the post and the line",
            output: "Both notes live in Quill’s memory only.",
          },
        ],
      }),
    ],
  },
  pulse: {
    status: "idle",
    notes: [
      {
        id: "pulse-compare",
        title: "Comparison",
        body: "Across the last three Friday drops in bay memory, isolation-led copy held 1.8× against feature-list copy. 41% of replies came from people posting after midnight. These figures are stubs, not a live analytics pull.",
        pinned: true,
        at: "01:58",
      },
    ],
    turns: [
      turn({
        id: "pulse-user",
        role: "user",
        at: "01:06",
        kind: "log",
        traces: [],
        body: "Pull the numbers on the last three Friday drops. Label the source.",
      }),
      turn({
        id: "pulse-metrics",
        role: "agent",
        at: "01:58",
        title: "The numbers",
        kind: "metrics",
        stats: [
          { label: "Hold vs feature list", value: "1.8×" },
          { label: "After-midnight replies", value: "41%" },
          { label: "Live pulls", value: "0" },
        ],
        body: "Isolation-led copy is the one to ship.\n\nThe feature list explains the harness. The constraint makes someone stop. Bay memory, three Fridays, same audience pocket.\n\nDo not put these figures in the post as if a dashboard produced them tonight. Say they are the read from this bay.",
        traces: [
          {
            id: "pulse-t1",
            tool: "metrics",
            input: "friday_drops last 3",
            output: "Stub table read inside bay 04. No warehouse connected.",
          },
          {
            id: "pulse-t2",
            tool: "compare",
            input: "isolation line vs feature list",
            output: "1.8× hold. Source: bay memory.",
          },
        ],
      }),
    ],
  },
  relay: {
    status: "idle",
    notes: [
      {
        id: "relay-letter",
        title: "Morning note",
        body: "Morning — Friday’s drop is ready. Lead with the bay, not the machine. The post is in Quill’s memory. Pulse reads 1.8× hold against the feature list, from bay memory. Paste when you want. Nothing was provisioned overnight. — Relay",
        pinned: true,
        at: "02:08",
      },
      {
        id: "relay-hold",
        title: "Do not send",
        body: "This bay drafts. Kenny sends. The schedule tool only marks 08:30 on a stub.",
        pinned: true,
        at: "02:09",
      },
    ],
    turns: [
      turn({
        id: "relay-user",
        role: "user",
        at: "01:06",
        kind: "log",
        traces: [],
        body: "Leave a morning note I can paste. Do not send it.",
      }),
      turn({
        id: "relay-letter",
        role: "agent",
        at: "02:08",
        title: "Morning note",
        kind: "letter",
        body: "Morning —\n\nFriday’s drop is ready. Lead with the bay, not the machine.\n\nThe post sits in Quill’s memory. Pulse has the hold at 1.8× against the feature list, and labeled it as bay memory.\n\nPaste when you want. I marked 08:30 on a stub calendar and sent nothing.\n\n— Relay",
        traces: [
          {
            id: "relay-t1",
            tool: "compose",
            input: "Morning note for Kenny",
            output: "Letter sealed in bay 05. Outbox is a stub.",
          },
          {
            id: "relay-t2",
            tool: "schedule",
            input: "08:30 local, do not fire",
            output: "Time marked. No calendar connected.",
          },
        ],
      }),
    ],
  },
};

export function createBays(): Record<string, BayState> {
  return structuredClone(SEED_BAYS);
}
