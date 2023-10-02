import { addToActual } from './actual.js';
import { getFinecoMovements } from './fineco.js';

await getFinecoMovements().then(addToActual);
