import assert from "node:assert/strict";
import test from "node:test";
import { planMockRun } from "./plan";

const agents = ["atlas", "scout", "quill", "pulse", "relay"];

test("every bay returns a reply, a trace, and a private note", () => {
  for (const agentId of agents) {
    const plan = planMockRun(agentId, "Prep a quieter Friday drop for operators who ship at night.");
    assert.ok(plan.reply.length > 40, agentId);
    assert.ok(plan.traces.length > 0, agentId);
    assert.ok(plan.note?.title, agentId);
    assert.equal(plan.reply.toLowerCase().includes("as an ai"), false);
  }
});

test("checklist and memory asks change the bay's job", () => {
  const checklist = planMockRun("quill", "Turn the morning brief into a Monday checklist.");
  assert.match(checklist.reply, /Monday/);
  const memory = planMockRun("scout", "What should this bay remember about the audience?");
  assert.match(memory.reply, /remember|Keep this/i);
});

test("atlas folds sibling reports without claiming a machine", () => {
  const plan = planMockRun("atlas", "Prep Friday", [
    { agentId: "scout", name: "Scout", reply: "Lead with the bay." },
    { agentId: "quill", name: "Quill", reply: "The post is short." },
    { agentId: "pulse", name: "Pulse", reply: "Hold is 1.8× from bay memory." },
    { agentId: "relay", name: "Relay", reply: "The note is unsent." },
  ]);
  assert.equal(plan.kind, "brief");
  assert.match(plan.reply, /Scout/);
  assert.match(plan.reply, /Quill/);
  assert.match(plan.reply, /Pulse/);
  assert.match(plan.reply, /Relay/);
  assert.match(plan.reply, /No VM was started/);
});
