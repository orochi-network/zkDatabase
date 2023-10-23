import {
  Poseidon,
  Field,
  MerkleTree
} from 'o1js';
import { TMerkleNodesMap } from '../../src/merkle-tree/merkle-tree-base.js';
import crypto from 'crypto';
import { MerkleTreeStorage } from '../../src/merkle-tree/merkle-tree-storage.js';
import { StorageEngineLocal } from '../../src/storage-engine/local.js';

const MERKLE_TREE_HEIGHT = 8;

function randomInteger(min: number, max: number): number {
  const randomValue = Math.random() * (max - min) + min;
  return Math.floor(randomValue);
}

function randomBigInt(min: bigint, max: bigint): bigint {
  const range = max - min + 1n;
  const randomBytes = crypto.getRandomValues(new Uint8Array(8));
  const randomValue = BigInt(
    '0x' +
      Array.from(randomBytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
  );
  return (randomValue % range) + min;
}

describe('Merkle-tree storage', () => {
  let localStorage: StorageEngineLocal;
  let merkleTree: MerkleTreeStorage;
  let expectedMerkleTree: MerkleTree;

  beforeEach(async () => {
    localStorage = await StorageEngineLocal.getInstance({
      location: './base',
    });

    merkleTree = new MerkleTreeStorage(localStorage, MERKLE_TREE_HEIGHT);
    expectedMerkleTree = new MerkleTree(MERKLE_TREE_HEIGHT);
  });

  afterEach(async () => {
    await localStorage.cleanUp();
  });

  it('fill merkle tree', async () => {
    // Setup
    const LEAF_AMOUNT = 100;
    let fields: Field[] = [];
    for (let i = 0; i < LEAF_AMOUNT; i++) {
      fields = fields.concat(Poseidon.hash(Field(i).toFields()));
    }

    expectedMerkleTree.fill(fields);
    const expectedResult: TMerkleNodesMap = JSON.parse(
      JSON.stringify(expectedMerkleTree)
    ).nodes;

    // Execute
    await merkleTree.fill(fields);

    //Verify
    const actualResult: TMerkleNodesMap = await merkleTree.getNodes();

    verifyNodes(actualResult, expectedResult);
  });

  it('root test', async () => {
    // Setup
    const LEAF_AMOUNT = 15;

    // Execute
    const avaiableIndexies = [0n];

    for (let i = 0; i < LEAF_AMOUNT; i++) {
      const leafIndex = randomBigInt(0n, merkleTree.leafCount);
      const leafValue = Poseidon.hash(Field(leafIndex).toFields());
      await merkleTree.setLeaf(leafIndex, leafValue);
      expectedMerkleTree.setLeaf(leafIndex, leafValue);

      avaiableIndexies.push(leafIndex);

      const expectedResult = expectedMerkleTree.getRoot();
      const actualResult = await merkleTree.getRoot();

      expect(actualResult.equals(expectedResult)).toBeTruthy();
    }
  });

  it('node test', async () => {
    // Setup
    const LEAF_AMOUNT = 30;

    // Execute
    const avaiableIndexies = [1n];

    for (let i = 0; i < LEAF_AMOUNT; i++) {
      const leafIndex = BigInt(i); //randomBigInt(0n, merkleTree.leafCount);
      const leafValue = Poseidon.hash(Field(leafIndex).toFields());
      await merkleTree.setLeaf(leafIndex, leafValue);
      expectedMerkleTree.setLeaf(leafIndex, leafValue);

      let randomLevel = randomInteger(0, MERKLE_TREE_HEIGHT);
      let randomIndex = 0n;

      if (i % 2 === 0) {
        randomIndex = randomBigInt(0n, merkleTree.leafCount);
      } else {
        const position = randomInteger(1, avaiableIndexies.length);
        randomIndex = avaiableIndexies[position];
      }

      avaiableIndexies.push(leafIndex);

      const expectedResult = expectedMerkleTree.getNode(
        randomLevel,
        randomIndex
      );
      const actualResult = await merkleTree.getNode(randomLevel, randomIndex);

      expect(actualResult.equals(expectedResult)).toBeTruthy();
    }
  });

  it('set leaf test', async () => {
    // Setup
    const LEAF_AMOUNT = 20;

    // Execute
    for (let i = 0; i < LEAF_AMOUNT; i++) {
      const leafIndex = randomBigInt(0n, merkleTree.leafCount - 1n);
      const leafValue = Poseidon.hash(Field(leafIndex).toFields());
      await merkleTree.setLeaf(leafIndex, leafValue);
      expectedMerkleTree.setLeaf(leafIndex, leafValue);
    }

    //Verify
    const actualResult: TMerkleNodesMap = await merkleTree.getNodes();
    const expectedResult: TMerkleNodesMap = JSON.parse(
      JSON.stringify(expectedMerkleTree)
    ).nodes;

    verifyNodes(actualResult, expectedResult);
  });

  function verifyNodes(
    actualNodeMap: TMerkleNodesMap,
    expectedNodeMap: TMerkleNodesMap
  ): boolean {
    const actualLevels = Object.keys(actualNodeMap).sort();
    const expectedLevels = Object.keys(expectedNodeMap).sort();

    expect(expectedLevels.length).toEqual(actualLevels.length);

    for (let i = 0; i < actualLevels.length; i++) {
      const level = actualLevels[i];
      expect(expectedLevels[i]).toEqual(level);

      const actualNodes = actualNodeMap[level as unknown as number];
      const expectedNodes = expectedNodeMap[level as unknown as number];
      const actualNodeKeys = Object.keys(actualNodes).sort();
      const expectedNodeKeys = Object.keys(expectedNodes).sort();

      expect(expectedNodeKeys.length).toEqual(actualNodeKeys.length);

      for (let j = 0; j < actualNodeKeys.length; j++) {
        const nodeKey = actualNodeKeys[j];
        expect(expectedNodeKeys[j]).toEqual(nodeKey);

        const actualField = Field(actualNodes[nodeKey]);
        const expectedField = expectedNodes[nodeKey];

        expect(actualField.equals(expectedField)).toBeTruthy();
      }
    }

    return true;
  }
});
