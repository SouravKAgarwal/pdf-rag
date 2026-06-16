/**
 * Parses a Server-Sent Events (SSE) stream from a ReadableStream and yields parsed JSON objects.
 * 
 * @param body The ReadableStream from the fetch response body.
 * @returns An async generator yielding parsed SSE data objects.
 */
export async function* parseSSEStream(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<Record<string, unknown>> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";

    for (const part of parts) {
      const line = part.trim();
      if (!line.startsWith("data: ")) continue;
      try {
        yield JSON.parse(line.slice(6)) as Record<string, unknown>;
      } catch {
        /* skip malformed JSON */
      }
    }
  }
}
