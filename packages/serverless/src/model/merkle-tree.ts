import ModelGeneral from './general';
import ModelMerkleTreePool from './merkle-tree-pool';
import { ModelMerkleTreeMetadata } from './merkle-tree-metadata';

export class ModelMerkleTree extends ModelGeneral {
  private modelMerkleTreePool: ModelMerkleTreePool;

  private modelMerkleTreeMetadata: ModelMerkleTreeMetadata;

  private constructor(
    databaseName: string,
    modelMerkleTreePool: ModelMerkleTreePool,
    modelMerkleTreeMetadata: ModelMerkleTreeMetadata
  ) {
    super(databaseName, 'merkle-tree');
    this.modelMerkleTreePool = modelMerkleTreePool;
    this.modelMerkleTreeMetadata = modelMerkleTreeMetadata;
  }

  public static async getInstance(databaseName: string, height: number) {
    const modelMerkleTreePool = ModelMerkleTreePool.getInstance(databaseName);
    const modelMerkleTreeMetadata =
      ModelMerkleTreeMetadata.getInstance(databaseName);

    const merkleTreeModel = new ModelMerkleTree(
      databaseName,
      modelMerkleTreePool,
      modelMerkleTreeMetadata
    );

    if (!(await merkleTreeModel.isCreated())) {
      await merkleTreeModel.create(height);
    }

    return merkleTreeModel;
  }

  public async isCreated(): Promise<Boolean> {
    return this.modelMerkleTreeMetadata.doesMetadataExist();
  }

  private async create(height: number) {
    this.modelMerkleTreeMetadata.create(height, '');
  }

  public async getRoot(): Promise<string | undefined> {
    return (await this.modelMerkleTreeMetadata.getMetadata())?.root;
  }
}

export default ModelMerkleTree;
