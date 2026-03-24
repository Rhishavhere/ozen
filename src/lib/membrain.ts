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
 * Generate time-bucket tags for temporal querying.
 * Returns tags like: day.2026-03-25, week.2026-W13, month.2026-03
 */
export function getTimeTags(): string[] {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");

  // ISO week number calculation
  const jan1 = new Date(yyyy, 0, 1);
  const dayOfYear = Math.floor((now.getTime() - jan1.getTime()) / 86400000) + 1;
  const weekNum = Math.ceil((dayOfYear + jan1.getDay()) / 7);
  const ww = String(weekNum).padStart(2, "0");

  return [
    `day.${yyyy}-${mm}-${dd}`,
    `week.${yyyy}-W${ww}`,
    `month.${yyyy}-${mm}`,
  ];
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
