import { Field } from 'o1js';
import ModelMerkleTree from '../model/merkle-tree';
import { ModelMerkleTreeMetadata } from '../model/merkle-tree-metadata';
import ModelMerkleTreePool from '../model/merkle-tree-pool';
import logger from '../helper/logger';

export default class MerkleTreeService {
  private merkleTree: ModelMerkleTree;

  private merkleTreePool: ModelMerkleTreePool;

  private merkleTreeMetadata: ModelMerkleTreeMetadata;

  private constructor(
    merkleTree: ModelMerkleTree,
    merkleTreePool: ModelMerkleTreePool,
    merkleTreeMetadata: ModelMerkleTreeMetadata
  ) {
    this.merkleTree = merkleTree;
    this.merkleTreePool = merkleTreePool;
    this.merkleTreeMetadata = merkleTreeMetadata;
  }

  public static async getInstance(
    databaseName: string
  ): Promise<MerkleTreeService> {
    const merkleTreePool = ModelMerkleTreePool.getInstance(databaseName);
    const merkleTreeMetadata =
      ModelMerkleTreeMetadata.getInstance(databaseName);
    const merkleTree = ModelMerkleTree.getInstance(databaseName);
    const merkleTreeService = new MerkleTreeService(
      merkleTree,
      merkleTreePool,
      merkleTreeMetadata
    );

    await merkleTreeService.init();

    return merkleTreeService;
  }

  public async init() {
    const height = await this.getHeight();
    if (height) {
      this.merkleTree.setHeight(height);
    }
  }

  public async create(height: number) {
    if (await this.getHeight()) {
      throw Error('Merkle Tree is already created');
    }
    await this.merkleTreeMetadata.setInitialHeight(height);

    this.merkleTree.setHeight(height);

    const root = await this.merkleTree.getNode(height - 1, 0n);

    await this.merkleTreeMetadata.createMetadata(root, new Date());
  }

  public async getHeight(): Promise<number | null> {
    return this.merkleTreeMetadata.getHeight();
  }

  public async build(amount: number): Promise<boolean> {
    let transactionResult = false;

    try {
      await this.merkleTree.withTransaction(async (session) => {
        this.merkleTree.setSession(session);
        this.merkleTreePool.setSession(session);
        this.merkleTreeMetadata.setSession(session);

        const height = await this.getHeight();
        if (!height) {
          throw new Error('Merkle Tree is not created');
        }

        const leaves = await this.merkleTreePool.getOldestLeaves(amount);
        const buildTime = new Date();

        const leafPromises = leaves.map((leaf) =>
          this.merkleTree.setLeaf(leaf.index, leaf.hash, buildTime)
        );

        await Promise.all(leafPromises);
        await this.merkleTreePool.removeLeaves(leaves);
        const newRoot = await this.merkleTree.getNode(
          height - 1,
          0n,
          buildTime
        );
        await this.merkleTreeMetadata.createMetadata(newRoot, buildTime);

        transactionResult = true;
      });
    } catch (error) {
      logger.error('Error during build:', error);
      transactionResult = false;
    } finally {
      this.merkleTree.removeSession();
      this.merkleTreePool.removeSession();
      this.merkleTreeMetadata.removeSession();
    }

    return transactionResult;
  }

  public async getWitness(root: Field, index: bigint) {
    const metadata = await this.merkleTreeMetadata.getMetadataByRoot(root);

    if (!metadata) {
      throw Error(
        `Merkle tree with the root ${root.toString()} does not exist`
      );
    }

    return this.merkleTree.getWitness(index, metadata.date);
  }

  public async getNode(root: Field, level: number, index: bigint) {
    const metadata = await this.merkleTreeMetadata.getMetadataByRoot(root);

    if (!metadata) {
      throw Error(
        `Merkle tree with the root ${root.toString()} does not exist`
      );
    }

    return this.merkleTree.getNode(level, index, metadata.date);
  }

  public async addLeafToPool(index: bigint, hash: Field): Promise<Boolean> {
    return this.merkleTreePool.saveLeaf(index, hash);
  }
}
