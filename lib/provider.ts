import type { ProviderName } from "./types";

function readKey(name: string): string | null {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

export function liveProvider(): ProviderName | null {
  if (readKey("ANTHROPIC_API_KEY")) return "anthropic";
  if (readKey("OPENROUTER_API_KEY")) return "openrouter";
  return null;
}

export function providerKey(provider: ProviderName): string | null {
  if (provider === "anthropic") return readKey("ANTHROPIC_API_KEY");
  return readKey("OPENROUTER_API_KEY");
}
