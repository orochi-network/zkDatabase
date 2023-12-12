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
    console.log('nodes')
    let merkleTreeStorage: MerkleTreeStorage;
    try {
      merkleTreeStorage = await MerkleTreeStorage.load(
        localStorage,
        DEFAULT_HEIGHT
      );
    } catch (error) {
      console.log('Error:', error);
    }

    for (let i = 6n; i < 100n; i++) {
      merkleTreeStorage!.setLeaf(i, Field(i));
    }

    try {
      console.log('await merkleTreeStorage!.save();')
      await merkleTreeStorage!.save();
    } catch (error) {
      console.log('error', error);
    }

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
