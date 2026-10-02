export type SseHandler = (event: string, data: unknown) => void;

export async function consumeSse(response: Response, onEvent: SseHandler): Promise<void> {
  if (!response.ok || !response.body) {
    const text = await response.text();
    throw new Error(text || `Run failed (${response.status})`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() ?? "";
    for (const chunk of chunks) {
      if (!chunk.trim()) continue;
      let event = "message";
      const dataLines: string[] = [];
      for (const line of chunk.split("\n")) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
      }
      if (!dataLines.length) continue;
      onEvent(event, JSON.parse(dataLines.join("\n")) as unknown);
    }
  }
}
