import { getAgent } from "./agents";
import { clip, firstSentence } from "./id";
import type { PlannedRun, Report } from "./types";

const LAUNCH = /friday|drop|launch|brief|post|campaign|overnight/i;
const CHECKLIST = /checklist|monday|todo|task list|steps/i;
const MEMORY = /remember|memory|audience|note about/i;

type TraceDraft = PlannedRun["traces"][number];

function trace(tool: string, input: string, output: string): TraceDraft {
  return { tool, input, output };
}

function scout(message: string, themed: boolean): PlannedRun {
  const subject = clip(message, 90);
  if (MEMORY.test(message)) {
    return {
      title: "Worth keeping",
      kind: "findings",
      traces: [
        trace("read", "Pinned notes in bay 02", "Opened audience + angle. No other bay was readable."),
        trace("note", "File what the ask is really about", "Note queued for Scout’s memory only."),
      ],
      reply: `Keep this in Scout’s bay, not on the shared desk.\n\nThe ask — “${subject}” — is about the people, not the tooling. They ship late, they skip adjectives, and they trust a constraint faster than a feature list.\n\nI would remember one sentence: they stop scrolling when the line admits a limit.`,
      note: {
        title: "Audience, restated",
        body: `From “${subject}”: late-night operators. They trust a named limit more than a feature list.`,
      },
    };
  }

  return {
    title: themed ? "The angle" : "What I found",
    kind: "findings",
    traces: [
      trace("search", subject, "3 hits in bay memory. No network call."),
      trace("read", "memory://angle", "Pinned note opened inside bay 02."),
      trace("note", "Pin the finding", "Kept in Scout’s memory. Invisible to the other bays."),
    ],
    reply: themed
      ? `The angle is still the bay, not the machine.\n\n“${subject}” wants a Friday line operators can repeat. Lead with isolation they can see on one desk. Do not promise a VM, a cluster, or a login wall.\n\nPhrase to earn the stop: bay. Phrase that breaks the demo if we fake it: provisioned.`
      : `I stayed inside this bay and read the notes against “${subject}”.\n\nThe useful cut is specific: name the worker, name the tool, name what did not happen. A VM did not boot. A key was not required.\n\nIf this goes to Quill, protect one concrete sentence and cut the category words.`,
    note: {
      title: themed ? "Angle for the drop" : "Finding",
      body: themed
        ? "Lead with the bay. Do not claim a VM, a cluster, or a key."
        : `Against “${subject}”: name the worker and name what did not run.`,
    },
  };
}

function quill(message: string, themed: boolean): PlannedRun {
  const subject = clip(message, 80);
  if (CHECKLIST.test(message)) {
    return {
      title: "Monday checklist",
      kind: "draft",
      traces: [
        trace("read", "memory://line-to-protect", "Opened Quill’s pinned line."),
        trace("draft", "Checklist from the brief", "Held in bay 03. Nothing scheduled."),
      ],
      reply: `Monday, in order:\n\n1. Read Atlas’s brief before opening anything else.\n2. Paste Relay’s note only if the line still feels true.\n3. Ship Quill’s post, or cut it in half.\n4. If a sentence says VM, change it to bay.\n5. Leave Pulse’s figures labeled as bay memory.`,
      note: {
        title: "Monday checklist",
        body: "Brief, note, post, language pass, label the figures.",
      },
    };
  }

  const draft = themed
    ? `Your agents do not need a data center.\n\nGive each one a bay: a name, a few tools, and a memory that does not leak into the next worker. The desk shows the night. The keys can wait.\n\nEvery worker gets a bay. None of them get a VM.`
    : `Here is the tight version of “${subject}”.\n\nOne worker. One bay. Tools that admit they are stubs. Memory that stays on that card when you click away.\n\nShip the sentence that draws the boundary. Cut the sentence that sells a machine we did not start.`;

  return {
    title: themed ? "The post" : "Draft",
    kind: "draft",
    traces: [
      trace("draft", subject, "Draft held in bay 03. Nothing published."),
      trace("revise", "Remove platform, unlock, fleet", "Category words cut."),
      trace("note", "Pin the draft", "Stored in Quill’s memory only."),
    ],
    reply: draft,
    note: {
      title: themed ? "Post draft" : "Draft",
      body: draft,
    },
  };
}

function pulse(message: string, themed: boolean): PlannedRun {
  const subject = clip(message, 80);
  return {
    title: "The numbers",
    kind: "metrics",
    stats: themed
      ? [
          { label: "Hold vs feature list", value: "1.8×" },
          { label: "After-midnight replies", value: "41%" },
          { label: "Live pulls", value: "0" },
        ]
      : [
          { label: "Bays on the desk", value: "5" },
          { label: "Shared memory", value: "None" },
          { label: "Machines", value: "0" },
        ],
    traces: [
      trace("metrics", themed ? "friday_drops last 3" : subject, "Stub table inside bay 04. No warehouse."),
      trace("compare", themed ? "isolation line vs feature list" : "claim vs evidence in this bay", "Comparison sealed. Source: bay memory."),
    ],
    reply: themed
      ? `Ship the constraint, not the feature list.\n\nBay memory — three Friday drops, not a live pull — has isolation-led copy holding 1.8× against a feature list. 41% of the replies in that stub set came after midnight.\n\nPut the source in the caption if these numbers leave the bay. I did not query an analytics tool.`
      : `Read against “${subject}”, using only this bay’s table.\n\nFive workers are on the desk. None of them share memory. None of them started a machine. If a claim needs a fresher number than that, it does not belong in tonight’s copy.`,
    note: {
      title: themed ? "Friday read" : "Read",
      body: themed
        ? "1.8× hold vs feature list. 41% after-midnight replies. Stub table, not a live pull."
        : "Five bays, no shared memory, no machines. Fresher numbers are out of scope tonight.",
    },
  };
}

function relay(message: string, themed: boolean): PlannedRun {
  const subject = clip(message, 90);
  const letter = themed
    ? `Morning —\n\nFriday’s drop is on the desk. Lead with the bay, not the machine.\n\nQuill has the post. Pulse labeled the 1.8× as bay memory. I did not send this.\n\n— Relay`
    : `Morning —\n\nYou asked: “${subject}”\n\nI left the answer in this bay and did not send it. Paste if it still sounds like you.\n\n— Relay`;

  return {
    title: "Ready to send",
    kind: "letter",
    traces: [
      trace("compose", subject, "Letter sealed in bay 05. Outbox is a stub."),
      trace("schedule", "08:30 local, do not fire", "Time marked. No calendar connected."),
    ],
    reply: letter,
    note: {
      title: "Unsent note",
      body: letter,
    },
  };
}

function atlasPlan(message: string): PlannedRun {
  const subject = clip(message, 100);
  return {
    title: "Desk plan",
    kind: "log",
    traces: [
      trace("delegate", `Scout — read “${subject}”`, "Slip handed to bay 02. In-process."),
      trace("delegate", "Quill — draft the words", "Slip handed to bay 03. In-process."),
      trace("delegate", "Pulse — numbers, labeled", "Slip handed to bay 04. In-process."),
      trace("delegate", "Relay — note, do not send", "Slip handed to bay 05. In-process."),
    ],
    reply: `I’ll split “${subject}” across the four bays and stay here.\n\nScout finds the cut. Quill writes it. Pulse puts a labeled number next to it. Relay leaves a note you can paste. No bay gets a machine.`,
    note: {
      title: "Tonight’s split",
      body: subject,
    },
  };
}

function atlasSynthesis(message: string, reports: Report[]): PlannedRun {
  const subject = clip(message, 90);
  const lines = reports.map((report) => `${report.name} — ${firstSentence(report.reply)}`);
  return {
    title: "Desk close",
    kind: "brief",
    stats: [
      { label: "Bays reported", value: String(reports.length) },
      { label: "Machines started", value: "0" },
      { label: "Note", value: "In Relay" },
    ],
    traces: [
      trace("summarize", `Fold ${reports.length} bay reports`, "Brief sealed in bay 01. Nothing provisioned."),
      trace("note", "Pin the close", "Standing note kept in Atlas’s memory only."),
    ],
    reply: `Night closed on “${subject}”.\n\n${lines.join("\n\n")}\n\nThe desk is the delivery. Keys stayed optional. No VM was started.`,
    note: {
      title: "Close",
      body: `Closed “${subject}” from ${reports.map((report) => report.name).join(", ")}.`,
    },
  };
}

export function planMockRun(agentId: string, message: string, reports?: Report[]): PlannedRun {
  const clean = message.trim();
  const themed = LAUNCH.test(clean);
  if (agentId === "atlas" && reports && reports.length > 0) {
    return atlasSynthesis(clean, reports);
  }
  if (agentId === "atlas") return atlasPlan(clean);
  if (agentId === "scout") return scout(clean, themed);
  if (agentId === "quill") return quill(clean, themed);
  if (agentId === "pulse") return pulse(clean, themed);
  if (agentId === "relay") return relay(clean, themed);

  const agent = getAgent(agentId);
  return {
    title: "Bay note",
    kind: "log",
    traces: [trace("note", clean, "Stub only.")],
    reply: `${agent?.name ?? "This bay"} has no plan for that id.`,
  };
}
