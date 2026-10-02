# Harness

An overnight **Bot / Dot** cockpit for Kenny Kline. Five named workers share a desk. Each one has its own tools and its own memory. None of them get a virtual machine.

Mock mode is the product. Open the app with zero API keys and last night’s brief is already on the desk.

Inspired by [Dhruval Golakiya’s overnight ask](https://x.com/dhruvalgolakiya/status/2105224441357840830) — a personal Bot / Dot where every agent has a computer. This repo is the scoped version: in-process bays, stub tools, optional live models.

## What you see in the first three seconds

- **Atlas** has already closed Friday’s drop. The morning brief is the lit sheet in the center.
- **Scout, Quill, Pulse, and Relay** each keep a different memory. Click a bay and the sheet, the notes, and the tool rack all change.
- The header says **Mock** and **0 VMs**. That is the whole infrastructure story.

## Workers

| Bay | Name | Job | Stub tools |
| --- | --- | --- | --- |
| 01 | Atlas | Coordinator | delegate, summarize, note |
| 02 | Scout | Research | search, read, note |
| 03 | Quill | Writer | draft, revise, note |
| 04 | Pulse | Analyst | metrics, compare, note |
| 05 | Relay | Comms | compose, schedule, note |

Search does not hit the network. Schedule does not touch a calendar. Compose does not send. Delegate does not boot a machine. Outputs say so.

Memory is per bay and stored in the browser under `harness.cockpit.v1`. **Restore last night** puts the seeded run back.

## Run it

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm test
npm run typecheck
npm run build
```

## Mock and live

Mock is the default, even if a key happens to be present. The desk toggle is the only way into live mode.

Copy `.env.example` to `.env.local` if you want a real model behind the same sheet:

```bash
# Claude, used first when both are set
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-sonnet-4-5

# Or OpenRouter, which can front Claude or a ChatGPT-family model
OPENROUTER_API_KEY=
OPENROUTER_MODEL=anthropic/claude-sonnet-4.5
# OPENROUTER_MODEL=openai/gpt-4.1
```

`GET /api/status` reports whether a provider is configured. It never returns the key. Live replies are still framed as bay work: the model is told the tools are stubs and that no machine exists.

## Dispatch

- **Run this bay** sends the slip to the focused worker.
- **Fan out overnight** runs Scout, Quill, Pulse, and Relay, then asks Atlas to close the desk.
- Prompt chips fill the box. Ctrl or Cmd Enter sends.

## Deploy

The app is a Next.js App Router project. Vercel needs no extra build settings.

1. Import `kkcandc/bot-dot-harness`.
2. Leave the env empty to ship the mock cockpit.
3. Add `ANTHROPIC_API_KEY` or `OPENROUTER_API_KEY` only if you want the Live toggle to light up.

No VM provider, no Docker, no per-agent host.

## Scope

This is a local and web UI demo. It does not provision computers, store credentials for other products, or connect ChatGPT sign-in. Isolation is a bay in the browser plus a server route that either scripts a mock run or calls one model.
