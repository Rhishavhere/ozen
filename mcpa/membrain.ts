/// <reference types="node" />
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

export interface MembrainMemoryResult {
  id: string;
  content: string;
  score: number;
}

export interface MembrainSearchResponse {
  results: MembrainMemoryResult[];
  interpreted?: string;
}

export interface MembrainJobResponse {
  job_id: string;
  status_url: string;
  status?: string;
}

/**
 * MembrainClient handles the connection to the Membrain Memory Oracle.
 */
export class MembrainClient {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.MEMBRAIN_API_KEY || process.env.VITE_MEMBRAIN_API_KEY || '';
    this.baseUrl = process.env.MEMBRAIN_API_URL || process.env.VITE_MEMBRAIN_API_URL || 'https://api.membrain.im';

    if (!this.apiKey || this.apiKey === 'your_api_key_here') {
      console.warn("WARNING: MEMBRAIN_API_KEY is not set or is using the default placeholder in .env.");
    }
  }

  /**
   * Helper for making fetch requests to Membrain
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'X-API-Key': this.apiKey,
      ...(options.headers || {})
    };

    const response = await fetch(url, { ...options, headers });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error body');
      throw new Error(`Membrain API Error (${response.status}): ${errorText}`);
    }

    return response.json() as Promise<T>;
  }

  /**
   * Search memories
   * @param query The search query
   * @param k Number of results to return
   */
  async search(query: string, k: number = 5): Promise<MembrainSearchResponse> {
    return this.request<MembrainSearchResponse>('/api/v1/memories/search', {
      method: 'POST',
      body: JSON.stringify({
        query,
        k,
        response_format: 'interpreted'
      })
    });
  }

  /**
   * Create a new memory
   * @param content The text content of the memory
   * @param tags Array of tags
   */
  async createMemory(content: string, tags: string[] = []): Promise<MembrainJobResponse> {
    return this.request<MembrainJobResponse>('/api/v1/memories', {
      method: 'POST',
      body: JSON.stringify({ content, tags })
    });
  }

  /**
   * Poll for job status
   * @param jobId The job ID returned from createMemory
   */
  async getJobStatus(jobId: string): Promise<MembrainJobResponse> {
    return this.request<MembrainJobResponse>(`/api/v1/memories/jobs/${jobId}`, {
      method: 'GET'
    });
  }

  /**
   * Verify all endpoints are reachable and API key is valid
   */
  async verifyConnection(): Promise<boolean> {
    console.log(`[MembrainClient] Verifying connection to ${this.baseUrl}...`);
    try {
      // 1. Verify Search Endpoint
      console.log(`[MembrainClient] Checking /api/v1/memories/search...`);
      const searchRes = await this.search("ping", 1);
      console.log(`[MembrainClient] Search Success. Found ${searchRes?.results?.length ?? 0} results.`);

      // 2. Verify Create Endpoint
      console.log(`[MembrainClient] Checking /api/v1/memories...`);
      const createRes = await this.createMemory("Integration verification ping", ["system", "ping"]);
      console.log(`[MembrainClient] Create Success. Job ID: ${createRes.job_id}`);

      // 3. Verify Job Polling
      if (createRes.job_id) {
        console.log(`[MembrainClient] Checking /api/v1/memories/jobs/${createRes.job_id}...`);
        const jobRes = await this.getJobStatus(createRes.job_id);
        console.log(`[MembrainClient] Poll Success. Job Status: ${jobRes.status || 'unknown'}`);
      }

      console.log(`[MembrainClient] ✅ Membrain connection verified successfully!`);
      return true;
    } catch (error: any) {
      console.error(`[MembrainClient] ❌ Connection verification failed:`, error.message);
      return false;
    }
  }
}

/**
 * MembrainMCPClient connects to Membrain directly via the Model Context Protocol
 */
export class MembrainMCPClient {
  private client: Client;
  private transport: SSEClientTransport | null = null;
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.MEMBRAIN_API_KEY || process.env.VITE_MEMBRAIN_API_KEY || '';
    this.baseUrl = process.env.MEMBRAIN_API_URL || process.env.VITE_MEMBRAIN_API_URL || 'https://api.membrain.com';
    
    this.client = new Client({
      name: "ozen-mcp-client",
      version: "1.0.0",
    }, {
      capabilities: {}
    });
  }

  async connect(): Promise<void> {
    // Membrain MCP SSE endpoint is heavily assumed to be /mcp/sse or similar.
    const sseUrl = new URL(this.baseUrl.replace(/\/$/, '') + '/mcp/sse');
    
    this.transport = new SSEClientTransport(sseUrl, {
      requestInit: {
        headers: {
          'X-API-Key': this.apiKey,
          'Authorization': `Bearer ${this.apiKey}`
        }
      }
    });

    console.log(`[MembrainMCP] Connecting to MCP SSE at ${sseUrl.toString()}...`);
    await this.client.connect(this.transport);
    console.log(`[MembrainMCP] Successfully connected to Membrain MCP!`);
  }

  async listTools() {
    if (!this.transport) await this.connect();
    const tools = await this.client.listTools();
    console.log(`[MembrainMCP] Available Tools:`, tools.tools.map(t => t.name));
    return tools.tools;
  }

  async searchMemories(query: string, k: number = 5) {
    if (!this.transport) await this.connect();
    console.log(`[MembrainMCP] Calling tool: search_memories for "${query}"...`);
    const result = await this.client.callTool({
      name: "search_memories",
      arguments: { query, k }
    });
    return result;
  }
}
