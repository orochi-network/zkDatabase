import { ZkDbProcessor } from './zkdb-processor.js';

const processor = new ZkDbProcessor(8);

processor.setLogger(console);

let start = Date.now();

await processor.compile(
  '/home/chiro/Git/zkDatabase/packages/smart-contract/cache',
  true
);

console.log(Date.now() - start, 'ms');
