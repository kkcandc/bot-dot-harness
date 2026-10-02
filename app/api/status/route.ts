import { liveProvider } from "@/lib/provider";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function GET() {
  const provider = liveProvider();
  return Response.json({
    sandbox: "in-process",
    vms: 0,
    provider,
    live: provider !== null,
  });
}
