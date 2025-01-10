import { Cache, VerificationKey } from 'o1js';
import { EZkDbContract } from './common.js';
import { logger } from './helper/logger.js';
import { ZkDbContract, ZkDbContractFactory } from './zkdb-contract.js';
import { ZkDbRollup, ZkDbRollupFactory } from './zkdb-rollup.js';

export class CompilerCache {
  public static cachePath: string = './cache';

  public static recompile: boolean = false;

  private static zkDbContractCompiled = new Map<string, ZkDbContract>();

  private static zkDbRollupCompiled = new Map<string, ZkDbRollup>();

  private static verificationKey = new Map<string, VerificationKey>();

  public static async getZkDbRollup(merkleHeight: number): Promise<ZkDbRollup> {
    const zkDbRollup = ZkDbRollupFactory(merkleHeight);
    const digest = await zkDbRollup.digest();
    const key = `${zkDbRollup.name}-${digest}-${merkleHeight}`;

    if (!CompilerCache.zkDbRollupCompiled.has(key)) {
      logger.debug(
        `Compiling ${EZkDbContract.zkdbRollup} revision: ${digest}...`
      );
      const { verificationKey } = await zkDbRollup.compile({
        cache: Cache.FileSystem(
          `${CompilerCache.cachePath}/${EZkDbContract.zkdbRollup}-${digest}/${merkleHeight}`
        ),
      });
      CompilerCache.verificationKey.set(key, verificationKey);
      CompilerCache.zkDbRollupCompiled.set(key, zkDbRollup);
    }
    return this.zkDbRollupCompiled.get(key)!;
  }

  public static async getZkDbContract(
    merkleHeight: number
  ): Promise<ZkDbContract> {
    1;
    const zkDbContract = ZkDbContractFactory(
      merkleHeight,
      await CompilerCache.getZkDbRollup(merkleHeight)
    );

    const digest = await zkDbContract.digest();
    const key = `${zkDbContract.name}-${digest}-${merkleHeight}`;

    if (!CompilerCache.zkDbContractCompiled.has(key)) {
      logger.debug(
        `Compiling ${EZkDbContract.zkdbContract} revision: ${digest}...`
      );
      const { verificationKey } = await zkDbContract.compile({
        cache: Cache.FileSystem(
          `${CompilerCache.cachePath}/${EZkDbContract.zkdbContract}-${digest}/${merkleHeight}`
        ),
      });
      CompilerCache.verificationKey.set(key, verificationKey);
      CompilerCache.zkDbContractCompiled.set(key, zkDbContract);
    }
    return this.zkDbContractCompiled.get(key)!;
  }

  public static async getVerificationKey(
    contract: ZkDbContract | ZkDbRollup,
    merkleHeight: number
  ) {
    const key = `${contract.name}-${await contract.digest()}-${merkleHeight}`;
    return CompilerCache.verificationKey.get(key);
  }
}
