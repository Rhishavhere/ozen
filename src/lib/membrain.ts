/**
 * Membrain REST client for ozen.
 * Called directly from hooks — no MCP server needed in the renderer process.
 */

const API_KEY = import.meta.env.VITE_MEMBRAIN_API_KEY as string;
const BASE_URL =
  (import.meta.env.VITE_MEMBRAIN_API_URL as string) ||
  "https://mem-brain-api-cutover-v4-production.up.railway.app";

function headers() {
  return {
    "Content-Type": "application/json",
    "X-API-Key": API_KEY,
  };
}

/**
 * Search memories and return a ready-to-inject system prompt string.
 * Returns empty string if Membrain is not configured or search fails.
 */
export async function searchMemories(query: string, k = 6): Promise<string> {
  if (!API_KEY) return "";
  try {
    const res = await fetch(`${BASE_URL}/api/v1/memories/search`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ query, k, response_format: "interpreted" }),
    });
    if (!res.ok) return "";
    const data = await res.json();

    // Prefer interpreted summary; fall back to raw content list
    if (data.interpreted?.answer_summary) {
      return `[Memory Context]\n${data.interpreted.answer_summary}`;
    }
    if (data.results?.length) {
      const lines = data.results
        .map((r: any) => r.content || r.memory?.content || "")
        .filter(Boolean)
        .slice(0, 5)
        .join("\n- ");
      return `[Memory Context]\n- ${lines}`;
    }
    return "";
  } catch {
    return "";
  }
}

/**
 * Store a memory. Fire-and-forget with background polling.
 * Silently fails if Membrain is not configured.
 */
export async function addMemory(
  content: string,
  tags: string[] = [],
): Promise<void> {
  if (!API_KEY || !content.trim()) return;
  try {
    const res = await fetch(`${BASE_URL}/api/v1/memories`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ content, tags }),
    });
    if (!res.ok) return;
    const { job_id } = await res.json();
    if (!job_id) return;

    // Poll in background — don't block the UI
    pollJob(job_id);
  } catch {
    // Silent fail — memory is non-critical
  }
}

async function pollJob(jobId: string, attempts = 0): Promise<void> {
  if (attempts > 10) return;
  try {
    await new Promise((r) => setTimeout(r, 2000));
    const res = await fetch(`${BASE_URL}/api/v1/memories/jobs/${jobId}`, {
      headers: headers(),
    });
    if (!res.ok) return;
    const data = await res.json();
    if (data.status === "completed" || data.status === "failed") return;
    pollJob(jobId, attempts + 1);
  } catch {
    return;
  }
}
