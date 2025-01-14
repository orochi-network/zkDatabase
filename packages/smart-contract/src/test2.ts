import { ZkDbProcessor } from './zkdb-processor.js';

const processor = await ZkDbProcessor.getInstance(8);

ZkDbProcessor.setLogger(console);

let start = Date.now();

console.log(Date.now() - start, 'ms');
