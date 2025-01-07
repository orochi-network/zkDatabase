import {
  CacheManager,
  DatabaseRollup,
  RollupProgram,
} from '@zkdb/smart-contract';
import { VerificationKey } from 'o1js';

export function getDatabaseRollupFunction(merkleHeight: number): RollupProxy {
  const rollup = RollupProgram(merkleHeight);
  return new RollupProxy(rollup, merkleHeight);
}

export class RollupProxy {
  private rollUp: DatabaseRollup;
  private merkleHeight: number;
  private verificationKey: VerificationKey | undefined = undefined;

  constructor(rollUp: DatabaseRollup, merkleHeight: number) {
    this.rollUp = rollUp;
    this.merkleHeight = merkleHeight;
  }

  async compile() {
    if (!this.verificationKey) {
      this.verificationKey = (
        await this.rollUp.compile({
          cache: await CacheManager.provideCache(
            'rollup-zkprogram',
            this.merkleHeight
          ),
        })
      ).verificationKey;
    }
  }

  getProgram(): DatabaseRollup {
    return this.rollUp;
  }
}
