import { addToActual, requiredEnv as actualEnv } from './actual.js';
import { getFinecoMovements, requiredEnv as finecoEnv } from './fineco.js';

const missing = [...finecoEnv, ...actualEnv].filter((name) => !process.env[name]);
if (missing.length > 0) {
  console.error(`Missing environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

await getFinecoMovements().then(addToActual);
