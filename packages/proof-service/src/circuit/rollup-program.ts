import { DatabaseRollUp, RollUpProgram } from '@zkdb/smart-contract';
import { CircuitCache } from './cache/circuit-cache.js';

export function getDatabaseRollUpFunction(
  name: string,
  merkleHeight: number
): RollUpProxy {
  const rollup = RollUpProgram(name, merkleHeight);
  return new RollUpProxy(rollup);
}

export class RollUpProxy {
  private rollUp: DatabaseRollUp;
  private isCompiled = false;

  constructor(rollUp: DatabaseRollUp) {
    this.rollUp = rollUp;
  }

  async compile() {
    if (this.isCompiled) {
      return;
    }

    const circuitCache = new CircuitCache();
    const cache = circuitCache.getCache(`database-rollup/${this.rollUp.name}`);
    await this.rollUp.compile({ cache });
    this.isCompiled = true;
  }

  getProgram(): DatabaseRollUp {
    return this.rollUp;
  }
}
