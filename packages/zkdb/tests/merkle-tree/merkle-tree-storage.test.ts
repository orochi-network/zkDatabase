import { StorageEngineLocal } from '../../src/storage-engine/local.js';
import { MerkleTreeStorage } from '../../src/merkle-tree/merkle-tree-storage.js';
import { Field } from 'o1js';

const BASE_PATH = 'base';

const DEFAULT_HEIGHT = 12;

describe('MerkleTreeStorage', () => {
  let localStorage: StorageEngineLocal;

  beforeAll(async () => {
    console.log('beforeAll')
    try {
      localStorage = await StorageEngineLocal.getInstance({
        location: `./${BASE_PATH}`,
      });
    } catch (error) {
      console.log('Error:', error);
    }
  });

  it('save nodes', async () => {
    console.log('await MerkleTreeStorage.load()');
    let merkleTreeStorage: MerkleTreeStorage = await MerkleTreeStorage.load(
      localStorage,
      DEFAULT_HEIGHT
    );
    for (let i = 6n; i < 100n; i++) {
      merkleTreeStorage!.setLeaf(i, Field(i));
    }

    console.log('await merkleTreeStorage!.save();')
    await merkleTreeStorage!.save();

    let newMerkleTreeStorage: MerkleTreeStorage;
    try {
      console.log('await MerkleTreeStorage.load(')
      newMerkleTreeStorage = await MerkleTreeStorage.load(
        localStorage,
        DEFAULT_HEIGHT
      );
    } catch (error) {
      console.log('Error:', error);
    }

    expect(merkleTreeStorage!.getRoot()).toEqual(
      newMerkleTreeStorage!.getRoot()
    );
  });
});
