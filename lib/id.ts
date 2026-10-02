export function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-3)}`;
}

export function clock(date = new Date()): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function clip(value: string, max = 140): string {
  const text = value.replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

export function firstSentence(value: string): string {
  const line = value
    .split("\n")
    .map((part) => part.trim())
    .find(Boolean);
  if (!line) return "Sealed an empty slip.";
  return clip(line, 120);
}
