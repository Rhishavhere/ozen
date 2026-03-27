export interface MemoryNode {
  id: string;
  content: string;
  tags?: string[];
  category?: string;
  timestamp?: string;
  semantic_score?: number;
  related_memories?: { id: string; content: string }[];
}

export interface GraphExport {
  nodes: MemoryNode[];
  edges: { source: string; target: string; description?: string }[];
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

export interface HubNode {
  id: string;
  content: string;
  degree: number;
}

export interface HubResponse {
  hubs: HubNode[];
}

export interface JobStatus {
  job_id: string;
  status: "queued" | "processing" | "completed" | "failed";
  result?: { memory_id: string; action: string };
  error?: { code: string; message: string };
}

export class MembrainClient {
  private baseUrl: string;
  private apiKey: string;
  private defaultTimeout = 30000; // 30 seconds

  constructor() {
    this.apiKey = import.meta.env.VITE_MEMBRAIN_API_KEY || "";
    this.baseUrl =
      import.meta.env.VITE_MEMBRAIN_API_URL ||
      "https://mem-brain-api-cutover-v4-production.up.railway.app";
    if (!this.apiKey) {
      console.warn("Missing VITE_MEMBRAIN_API_KEY in environment - API calls may fail");
    }
  }

  private async fetchWithTimeout(
    url: string,
    options: RequestInit = {},
    timeout = this.defaultTimeout
  ): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    // Combine caller signal with timeout controller so both work independently.
    // When the caller signal fires, we forward it to the controller so the
    // timeout branch also gets cleaned up.
    if (options.signal) {
      if (options.signal.aborted) {
        clearTimeout(id);
        controller.abort();
      } else {
        options.signal.addEventListener('abort', () => controller.abort(), { once: true });
      }
    }

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal, // always use the controller's signal
      });
      clearTimeout(id);
      return response;
    } catch (error: any) {
      clearTimeout(id);
      if (error.name === 'AbortError') {
        // Distinguish timeout from caller-initiated cancellation
        if (options.signal?.aborted) {
          throw new DOMException('Request was cancelled by caller', 'AbortError');
        }
        throw new Error(`Request timeout after ${timeout}ms`);
      }
      throw error;
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    signal?: AbortSignal,
  ): Promise<T> {
    const url = `${this.baseUrl}/api/v1${endpoint}`;
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      "X-API-Key": this.apiKey,
      ...options.headers,
    };
    const response = await this.fetchWithTimeout(url, { ...options, headers, signal });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }
    return response.json();
  }

  async search(
    query: string,
    k = 8,
    responseFormat: "raw" | "interpreted" | "both" = "both",
    signal?: AbortSignal,
  ): Promise<any> {
    return this.request(
      "/memories/search",
      {
        method: "POST",
        body: JSON.stringify({ query, k, response_format: responseFormat }),
      },
      signal,
    );
  }

  async create(
    content: string,
    tags?: string[],
    category?: string,
  ): Promise<{ memory_id: string; status: string }> {
    const job = await this.request<{
      job_id: string;
      job_status: string;
      status_url: string;
    }>("/memories", {
      method: "POST",
      body: JSON.stringify({ content, tags, category }),
    });
    // Poll job until completion
    let status = job.job_status;
    let result = null;
    while (status !== "completed" && status !== "failed") {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const statusCheck = await this.request<JobStatus>(
        `/memories/jobs/${job.job_id}`,
      );
      status = statusCheck.status;
      if (status === "completed") {
        result = statusCheck.result;
      } else if (status === "failed") {
        throw new Error(statusCheck.error?.message || "Ingest failed");
      }
    }
    return { memory_id: result!.memory_id, status };
  }

  async getById(id: string): Promise<MemoryNode> {
    const res = await this.request<any>(`/memories/${id}`);
    return res.memory || res;
  }

  async update(id: string, content: string, tags?: string[]): Promise<boolean> {
    await this.request(`/memories/${id}`, {
      method: "PUT",
      body: JSON.stringify({ content, tags }),
    });
    return true;
  }

  async delete(id: string): Promise<boolean> {
    await this.request(`/memories/${id}`, { method: "DELETE" });
    return true;
  }

  async bulkDelete(tags?: string[], category?: string): Promise<boolean> {
    const params = new URLSearchParams();
    if (tags) params.append("tags", tags.join(","));
    if (category) params.append("category", category);
    await this.request(`/memories/bulk?${params.toString()}`, {
      method: "DELETE",
    });
    return true;
  }

  async graphExport(): Promise<GraphExport> {
    const res = await this.request<any>("/graph/export");
    return res.graph || res;
  }

  async hubs(limit = 12): Promise<HubResponse> {
    return this.request(`/graph/hubs?limit=${limit}`);
  }

  async neighborhood(memoryId: string, hops = 2): Promise<GraphExport> {
    const res = await this.request<any>(
      `/graph/neighborhood?memory_id=${memoryId}&hops=${hops}`,
    );
    return res.graph || res;
  }

  async stats(signal?: AbortSignal): Promise<any> {
    const url = `${this.baseUrl}/api/v1/stats`;
    const response = await this.fetchWithTimeout(url, {
      headers: { "X-API-Key": this.apiKey },
      signal,
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch stats: HTTP ${response.status}`);
    }
    return response.json();
  }

  async health(signal?: AbortSignal): Promise<any> {
    // Bug fix: use /api/v1/health to match the API base prefix used by request()
    return this.request('/health', {}, signal);
  }

  async count(tag?: string): Promise<{ count: number }> {
    const params = tag ? `?tags=${encodeURIComponent(tag)}` : "";
    return this.request(`/memories/count${params}`);
  }
}

// Add after the class definition
const defaultClient = new MembrainClient();

export async function searchMemories(
  query: string,
  k = 8,
  responseFormat: "raw" | "interpreted" | "both" = "both",
  signal?: AbortSignal,
) {
  return defaultClient.search(query, k, responseFormat, signal);
}

export async function addMemory(
  content: string,
  tags?: string[],
  category?: string,
) {
  return defaultClient.create(content, tags, category);
}
