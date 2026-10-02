import assert from "node:assert/strict";
import test from "node:test";
import { parseModelPayload } from "./parse";
import { hydrateCockpit, serializeCockpit } from "./storage";
import { createBays } from "./seed";

test("parses a fenced model payload and drops broken traces", () => {
  const plan = parseModelPayload(`Sure.\n\`\`\`json
{"title":"Angle","kind":"findings","traces":[{"tool":"search","input":"bay","output":"stub"},{"tool":"nope"}],"reply":"Lead with the bay.","note":{"title":"Angle","body":"Bay, not VM."}}
\`\`\``);
  assert.equal(plan.title, "Angle");
  assert.equal(plan.kind, "findings");
  assert.equal(plan.traces.length, 1);
  assert.equal(plan.note?.title, "Angle");
});

test("falls back to prose when the model skips JSON", () => {
  const plan = parseModelPayload("Just a paragraph from the bay.");
  assert.match(plan.reply, /paragraph/);
  assert.equal(plan.traces.length, 0);
});

test("round-trips cockpit memory without keeping a working flag", () => {
  const bays = createBays();
  bays.scout.status = "working";
  bays.scout.notes.push({
    id: "extra",
    title: "Late note",
    body: "Only Scout should see this.",
    pinned: false,
    at: "03:00",
  });
  const saved = serializeCockpit("scout", bays);
  const hydrated = hydrateCockpit(JSON.stringify(saved));
  assert.ok(hydrated);
  assert.equal(hydrated?.focusedId, "scout");
  assert.equal(hydrated?.bays.scout.status, "idle");
  assert.equal(hydrated?.bays.scout.notes.some((note) => note.title === "Late note"), true);
  assert.equal(hydrated?.bays.quill.notes.some((note) => note.title === "Late note"), false);
});
