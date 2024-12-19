import {
  CacheManager,
  DatabaseRollUp,
  RollUpProgram,
} from '@zkdb/smart-contract';
import { VerificationKey } from 'o1js';

export function getDatabaseRollUpFunction(merkleHeight: number): RollUpProxy {
  const rollup = RollUpProgram(merkleHeight);
  return new RollUpProxy(rollup, merkleHeight);
}

export class RollUpProxy {
  private rollUp: DatabaseRollUp;
  private merkleHeight: number;
  private verificationKey: VerificationKey | undefined = undefined;

  constructor(rollUp: DatabaseRollUp, merkleHeight: number) {
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

  getProgram(): DatabaseRollUp {
    return this.rollUp;
  }
}
