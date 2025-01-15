import {
  Field,
  MerkleWitness,
  PublicKey,
  VerificationKey,
  ZkProgram,
} from 'o1js';
import { Witness } from 'o1js/dist/node/lib/provable/merkle-tree.js';
import {
  TRollupProof,
  TRollupSerializedProof,
  TRollupTransition,
} from './common.js';
import { CompilerCache } from './compiler-cache.js';
import { logger, LoggerSet } from './helper/logger.js';
import { ZkDbContract } from './zkdb-contract.js';
import { ZkDbRollup, ZkDbRollupInput } from './zkdb-rollup.js';

const processorCache = {
  zkDbContract: new Map<string, InstanceType<ZkDbContract>>(),
  zkdbRollup: new Map<string, ZkDbRollup>(),
  compiledZkDbContract: new Map<string, ZkDbContract>(),
  compiledZkdbRollup: new Map<string, ZkDbRollup>(),
};

export class ZkDbProcessor {
  private static cache: Map<string, InstanceType<ZkDbContract>> = new Map();

  private zkdbContract: ZkDbContract;

  private zkdbRollup: ZkDbRollup;

  private startTime: number = 0;

  private startMeasure() {
    this.startTime = Date.now();
  }

  #vkContract: VerificationKey;

  #vkRollup: VerificationKey;

  public readonly merkleHeight: number; // readonly

  private get elapsedTime(): string {
    return `${(Date.now() - this.startTime).toLocaleString('en-US')} ms`;
  }

  public get vkContract() {
    return this.#vkContract;
  }

  public get vkRollup() {
    return this.#vkRollup;
  }

  private constructor(
    zkDbContract: ZkDbContract,
    vkContract: VerificationKey,
    zkdbRollup: ZkDbRollup,
    vkRollup: VerificationKey,
    merkleHeight: number
  ) {
    this.zkdbRollup = zkdbRollup;
    this.zkdbContract = zkDbContract;
    this.merkleHeight = merkleHeight;
    this.#vkContract = vkContract;
    this.#vkRollup = vkRollup;
  }

  public static configCache(cachePath: string, recompile: boolean = false) {
    CompilerCache.cachePath = cachePath;
    CompilerCache.recompile = recompile;
  }

  public static setLogger(logger: any): void {
    LoggerSet(logger);
  }

  public static async getInstance(
    merkleHeight: number
  ): Promise<ZkDbProcessor> {
    let startTime = Date.now();
    const zkdbRollup = await CompilerCache.getZkDbRollup(merkleHeight);
    logger.debug(
      `Loaded ZkDbRollup in: ${(Date.now() - startTime).toLocaleString('en-US')} ms`
    );

    startTime = Date.now();
    const zkdbContract = await CompilerCache.getZkDbContract(merkleHeight);
    logger.debug(
      `Loaded ZkDbContract in: ${(Date.now() - startTime).toLocaleString('en-US')} ms`
    );

    const vkRollup = await CompilerCache.getVerificationKey(
      zkdbRollup,
      merkleHeight
    );

    const vkContract = await CompilerCache.getVerificationKey(
      zkdbContract,
      merkleHeight
    );

    if (!vkContract) {
      throw new Error('Verification key of contract not found');
    }

    if (!vkRollup) {
      throw new Error('Verification key of rollup not found');
    }

    return new ZkDbProcessor(
      zkdbContract,
      vkContract,
      zkdbRollup,
      vkRollup,
      merkleHeight
    );
  }

  public getInstanceZkDBContract(
    publicKey: PublicKey,
    tokenId?: Field
  ): InstanceType<ZkDbContract> {
    const publicKeyString = publicKey.toBase58();
    if (!ZkDbProcessor.cache.has(publicKeyString)) {
      logger.debug(
        `Create new instance of zkDatabase Contract for: ${publicKeyString}`
      );
      processorCache.zkDbContract.set(
        publicKeyString,
        new this.zkdbContract(publicKey, tokenId)
      );
    }
    return processorCache.zkDbContract.get(publicKeyString)!;
  }

  getInstanceZkDBRollup(): ZkDbRollup {
    return this.zkdbRollup;
  }

  async init(
    initialRoot: Field,
    merkleProof: Witness,
    leaf: Field
  ): Promise<TRollupProof> {
    class MerkleProof extends MerkleWitness(this.merkleHeight) {}

    logger.debug(
      `Initializing zkDatabase Rollup with initial root ${initialRoot.toString()}`
    );

    this.startMeasure();

    const zkProof = await this.zkdbRollup.init(
      new ZkDbRollupInput({
        step: Field(0),
        merkleRootOld: Field(0),
        merkleRootNew: initialRoot,
      }),
      new MerkleProof(merkleProof),
      leaf
    );

    logger.debug(`Prove step 0 to 1 in ${this.elapsedTime}`);

    return {
      step: zkProof.proof.publicOutput.step,
      proof: zkProof.proof,
      merkleRootOld: initialRoot,
    };
  }

  async update(
    proofPrevious: TRollupProof,
    transition: TRollupTransition
  ): Promise<TRollupProof> {
    class MerkleProof extends MerkleWitness(this.merkleHeight) {}

    this.startMeasure();

    logger.debug(
      `Prove the transition from ${proofPrevious.merkleRootOld.toString()} to ${transition.merkleRootNew.toString()}`
    );

    const proof = await this.zkdbRollup.update(
      new ZkDbRollupInput({
        step: proofPrevious.step,
        merkleRootOld: proofPrevious.merkleRootOld,
        merkleRootNew: transition.merkleRootNew,
      }),
      proofPrevious.proof,
      new MerkleProof(transition.merkleProof),
      transition.leafOld,
      transition.leafNew
    );

    if (!proof.proof.publicOutput.merkleRoot.equals(transition.merkleRootNew)) {
      throw new Error('Proof does not match the new Merkle Root');
    }

    logger.debug(
      `Prove step ${proofPrevious.step.toString()} to ${proofPrevious.step.add(1).toString()} in ${this.elapsedTime}`
    );

    return {
      step: proofPrevious.step.add(1),
      proof: proof.proof,
      merkleRootOld: proof.proof.publicOutput.merkleRoot,
    };
  }

  serialize(proof: TRollupProof): TRollupSerializedProof {
    return {
      step: proof.step.toString(),
      proof: proof.proof.toJSON(),
      merkleRootOld: proof.merkleRootOld.toString(),
    };
  }

  async deserialize(proofStr: string): Promise<TRollupProof> {
    class ZkDbRollupProof extends ZkProgram.Proof(this.zkdbRollup) {}

    const { step, proof, merkleRootOld } = JSON.parse(proofStr);

    return {
      step: Field(step),
      proof: await ZkDbRollupProof.fromJSON(proof),
      merkleRootOld: Field(merkleRootOld),
    };
  }
}
