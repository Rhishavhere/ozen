import { config } from 'dotenv';
config();
import { MembrainClient } from './membrain.ts';

const client = new MembrainClient();
client.verifyConnection().then((success) => {
  if (!success) {
    process.exit(1);
  }
});
