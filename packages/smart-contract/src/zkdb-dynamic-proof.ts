import { DynamicProof, FeatureFlags } from 'o1js';
import { ZkDbRollupInput, ZkDbRollupOutput } from './zkdb-rollup';

export class ZkDbRollupDynamicProof extends DynamicProof<
  ZkDbRollupInput,
  ZkDbRollupOutput
> {
  static publicInputType = ZkDbRollupInput;
  static publicOutputType = ZkDbRollupOutput;

  static maxProofsVerified = 0 as const;

  static featureFlags = FeatureFlags.allMaybe;
}
