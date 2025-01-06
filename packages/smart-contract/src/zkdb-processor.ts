import {
  Cache,
  Field,
  JsonProof,
  MerkleWitness,
  Proof,
  PublicKey,
  ZkProgram,
} from 'o1js';
import { Witness } from 'o1js/dist/node/lib/provable/merkle-tree.js';
import { logger, LoggerSet } from './helper/logger.js';
import { ZkDbContract, ZkDbContractFactory } from './zkdb-contract.js';
import {
  ZkDbRollup,
  ZkDbRollupFactory,
  ZkDbRollupInput,
  ZkDbRollupOutput,
} from './zkdb-rollup.js';

export type TRollupProof = {
  step: Field;
  proof: Proof<ZkDbRollupInput, ZkDbRollupOutput>;
  merkleRootOld: Field;
};

export type TRollupSerializedProof = {
  step: string;
  proof: JsonProof;
  merkleRootOld: string;
};

export type TRollupTransition = {
  merkleRootNew: Field;
  merkleProof: Witness;
  leafOld: Field;
  leafNew: Field;
};

export class ZkDbProcessor {
  private cache: Map<string, InstanceType<ZkDbContract>>;

  private zkdbContract: ZkDbContract;

  private zkdbRollup: ZkDbRollup;

  public readonly merkleHeight: number; // readonly

  constructor(merkleHeight: number) {
    this.zkdbRollup = ZkDbRollupFactory(merkleHeight);
    this.zkdbContract = ZkDbContractFactory(merkleHeight, this.zkdbRollup);
    this.merkleHeight = merkleHeight;
    this.cache = new Map<string, any>();
  }

  setLogger(logger: any): void {
    LoggerSet(logger);
  }

  getInstanceZkDBContract(
    publicKey: PublicKey,
    tokenId?: Field
  ): InstanceType<ZkDbContract> {
    const publicKeyString = publicKey.toBase58();
    if (!this.cache.has(publicKeyString)) {
      logger.debug(
        `Create new instance of zkDatabase Contract for: ${publicKeyString}`
      );
      this.cache.set(
        publicKeyString,
        new this.zkdbContract(publicKey, tokenId)
      );
    }
    return this.cache.get(publicKeyString)!;
  }

  getInstanceZkDBRollup(): ZkDbRollup {
    return this.zkdbRollup;
  }

  async compile(cachePath: string, forceRecompile: boolean = false) {
    if (forceRecompile) {
      logger.info(`Force recompiling zkDatabase Contract and Rollup Program`);
    }
    const zkdbRollup = await this.zkdbRollup.compile({
      cache: Cache.FileSystem(`${cachePath}/rollup/${this.merkleHeight}`),
      forceRecompile,
    });

    const zkdbContract = await this.zkdbContract.compile({
      cache: Cache.FileSystem(`${cachePath}/contract/${this.merkleHeight}`),
      forceRecompile,
    });

    return {
      zkdbContract,
      zkdbRollup,
    };
  }

  async init(initialRoot: Field, merkleProof: Witness): Promise<TRollupProof> {
    class MerkleProof extends MerkleWitness(this.merkleHeight) {}

    logger.debug(
      `Initializing zkDatabase Rollup with initial root ${initialRoot.toString()}`
    );

    const startTime = Date.now();

    const zkProof = await this.zkdbRollup.init(
      new ZkDbRollupInput({
        step: Field(0),
        merkleRootNew: initialRoot,
        merkleRootOld: initialRoot,
      }),
      new MerkleProof(merkleProof)
    );

    logger.debug(
      `Prove step 0 to 1 in ${(Date.now() - startTime).toLocaleString('en-US')} ms`
    );

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

    const startTime = Date.now();

    logger.debug(
      `Prove the transition from ${proofPrevious.merkleRootOld.toString()} to ${transition.merkleRootNew.toString()}`
    );

    const proof = await this.zkdbRollup.update(
      new ZkDbRollupInput({
        step: proofPrevious.step,
        merkleRootNew: transition.merkleRootNew,
        merkleRootOld: proofPrevious.merkleRootOld,
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
      `Prove step ${proofPrevious.step.toString()} to ${proofPrevious.step.add(1).toString()} in ${(Date.now() - startTime).toLocaleString('en-US')} ms`
    );

    return {
      step: proofPrevious.step.add(1),
      proof: proof.proof,
      merkleRootOld: proof.proof.publicOutput.merkleRoot,
    };
  }

  serialize(proof: TRollupProof) {
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
