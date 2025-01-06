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
  step: bigint;
  proof: Proof<ZkDbRollupInput, ZkDbRollupOutput>;
  merkleRootOnChain: Field;
  merkleRootOld: Field;
};

export type TRollupSerializedProof = {
  step: string;
  proof: JsonProof;
  merkleRootOnChain: string;
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
        merkleRootNew: initialRoot,
        merkleRootOld: initialRoot,
        merkleRootOnChain: initialRoot,
      }),
      new MerkleProof(merkleProof)
    );

    logger.debug(
      `Prove complete of step 0 in ${(Date.now() - startTime).toLocaleString('en-US')} ms`
    );

    return {
      step: 0n,
      proof: zkProof.proof,
      merkleRootOnChain: initialRoot,
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
        merkleRootNew: transition.merkleRootNew,
        merkleRootOld: proofPrevious.merkleRootOld,
        merkleRootOnChain: proofPrevious.merkleRootOnChain,
      }),
      proofPrevious.proof,
      new MerkleProof(transition.merkleProof),
      transition.leafOld,
      transition.leafNew
    );

    if (!proof.proof.publicOutput.merkleRoot.equals(transition.merkleRootNew)) {
      throw new Error('Proof does not match the new Merkle Root');
    }

    if (
      !proof.proof.publicOutput.merkleRootOnChain.equals(
        proofPrevious.merkleRootOnChain
      )
    ) {
      throw new Error('Merkle Root on chain does not match');
    }

    logger.debug(
      `Prove complete of step ${(proofPrevious.step + 1n).toString()} in ${(Date.now() - startTime).toLocaleString('en-US')} ms`
    );

    return {
      step: proofPrevious.step + 1n,
      proof: proof.proof,
      merkleRootOnChain: proofPrevious.merkleRootOnChain,
      merkleRootOld: proof.proof.publicOutput.merkleRoot,
    };
  }

  serialize(proof: TRollupProof) {
    return {
      step: proof.step.toString(),
      proof: proof.proof.toJSON(),
      merkleRootOnChain: proof.merkleRootOnChain.toString(),
      merkleRootOld: proof.merkleRootOld.toString(),
    };
  }

  async deserialize(proofStr: string): Promise<TRollupProof> {
    class ZkDbRollupProof extends ZkProgram.Proof(this.zkdbRollup) {}

    const { step, proof, merkleRootOnChain, merkleRootOld } =
      JSON.parse(proofStr);

    return {
      step: BigInt(step),
      proof: await ZkDbRollupProof.fromJSON(proof),
      merkleRootOnChain: Field(merkleRootOnChain),
      merkleRootOld: Field(merkleRootOld),
    };
  }
}
