import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { MembrainClient } from "./membrain.js";
import { config } from "dotenv";

config();

const membrain = new MembrainClient();

class MembrainMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: "ozen-membrain-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    
    // Error handling
    this.server.onerror = (error) => console.error("[MCP Error]", error);
    process.on("SIGINT", async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "membrain_search",
          description: "Semantic search over the user's memory graph using Membrain. Use this before answering any questions requiring historic context.",
          inputSchema: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Natural-language query to search for in memories.",
              },
              k: {
                type: "number",
                description: "Number of hits to retrieve. Defaults to 5.",
              },
            },
            required: ["query"],
          },
        },
        {
          name: "membrain_add",
          description: "Store a new atomic fact or memory persistently into Membrain. Use this when the user mentions something important to remember.",
          inputSchema: {
            type: "object",
            properties: {
              content: {
                type: "string",
                description: "The atomic fact to store.",
              },
              tags: {
                type: "array",
                items: { type: "string" },
                description: "Optional list of tags e.g. ['type.preference', 'scope.user'].",
              },
            },
            required: ["content"],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      switch (request.params.name) {
        case "membrain_search": {
          const query = String(request.params.arguments?.query);
          const k = Number(request.params.arguments?.k) || 5;

          try {
            const results = await membrain.search(query, k);
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(results, null, 2),
                },
              ],
            };
          } catch (error: any) {
            return {
              content: [
                {
                  type: "text",
                  text: `Search API Error: ${error.message}`,
                },
              ],
              isError: true,
            };
          }
        }

        case "membrain_add": {
          const content = String(request.params.arguments?.content);
          const tags = request.params.arguments?.tags as string[] | undefined;

          try {
            const result = await membrain.createMemory(content, tags || []);
            
            // The job is asynchronous. According to docs, we need to poll.
            // But for MCP tools, we can poll directly inside the tool to ensure completion.
            console.error(`[MembrainMCP] Polling job ${result.job_id}...`);
            
            let finalStatus = await membrain.getJobStatus(result.job_id);
            let attempts = 0;
            while (finalStatus.status !== "completed" && finalStatus.status !== "failed" && attempts < 10) {
              await new Promise(res => setTimeout(res, 2000));
              finalStatus = await membrain.getJobStatus(result.job_id);
              attempts++;
            }

            return {
              content: [
                {
                  type: "text",
                  text: `Memory created successfully. Job status: ${finalStatus.status}`,
                },
              ],
            };
          } catch (error: any) {
            return {
              content: [
                {
                  type: "text",
                  text: `Create API Error: ${error.message}`,
                },
              ],
              isError: true,
            };
          }
        }

        default:
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${request.params.name}`
          );
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Membrain MCP Server running on stdio");
  }
}

const server = new MembrainMCPServer();
server.run().catch(console.error);
