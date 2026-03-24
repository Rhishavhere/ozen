import { config } from 'dotenv';
config();
import { MembrainMCPClient } from './membrain.ts';

const mcpClient = new MembrainMCPClient();
mcpClient.connect().then(() => mcpClient.listTools()).then((tools) => {
  console.log(`[MembrainMCP] Verification Complete. Found ${tools.length} MCP tools.`);
  process.exit(0);
}).catch(err => {
  console.error(`[MembrainMCP] MCP Verification Failed:`, err);
  process.exit(1);
});
