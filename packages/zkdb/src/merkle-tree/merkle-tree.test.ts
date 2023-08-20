import { Poseidon, Field, MerkleTree, Circuit, Bool } from 'snarkyjs';
import { TMerkleNodesMap, BaseMerkleTree } from './merkle-tree-base.js';
import crypto from 'crypto';
import { MerkleTreeStorage } from './merkle-tree-storage.js';
import { StorageEngineLocal } from '../storage-engine/local.js';

const DEFAULT_HEIGHT = 20;

(async function run() {
  const storage = await StorageEngineLocal.getInstance({
    location: './base',
  });
  const merkleTreeJSON = new MerkleTreeStorage(storage, DEFAULT_HEIGHT);
  const expectedMerkleTree = new MerkleTree(DEFAULT_HEIGHT);

  await getFillMerkleTreeTest(merkleTreeJSON, expectedMerkleTree);
  await getNodeTest(merkleTreeJSON, expectedMerkleTree);
  await getRootTest(merkleTreeJSON, expectedMerkleTree);
  await getSetLeafMerkleTreeTest(merkleTreeJSON, expectedMerkleTree);
})();

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

async function getRootTest(
  merkleTree: BaseMerkleTree,
  expectedMerkleTree: MerkleTree
) {
  // Setup
  const LEAF_AMOUNT = 15;

  // Execute
  let isPassed = Bool(true);

  const avaiableIndexies = [0n];

  for (let i = 0; i < LEAF_AMOUNT; i++) {
    const leafIndex = randomBigInt(0n, merkleTree.leafCount);
    const leafValue = Poseidon.hash(Field(leafIndex).toFields());
    await merkleTree.setLeaf(leafIndex, leafValue);
    expectedMerkleTree.setLeaf(leafIndex, leafValue);

    avaiableIndexies.push(leafIndex);

    const expectedResult = expectedMerkleTree.getRoot();
    const actualResult = await merkleTree.getRoot();

    if (actualResult === null) {
      isPassed = Bool(false);
      break;
    }

    isPassed = isPassed.and(actualResult.equals(expectedResult));
  }

  //Verify
  Circuit.log('getRoot test is passed', isPassed);
}

async function getNodeTest(
  merkleTree: BaseMerkleTree,
  expectedMerkleTree: MerkleTree
) {
  // Setup
  const LEAF_AMOUNT = 30;

  const zeroes: Field[] = JSON.parse(JSON.stringify(expectedMerkleTree)).zeroes;

  // Execute
  let isPassed = Bool(true);

  const avaiableIndexies = [1n];

  for (let i = 0; i < LEAF_AMOUNT; i++) {
    console.log('index', i);
    const leafIndex = BigInt(i); //randomBigInt(0n, merkleTree.leafCount);
    const leafValue = Poseidon.hash(Field(leafIndex).toFields());
    await merkleTree.setLeaf(leafIndex, leafValue);
    expectedMerkleTree.setLeaf(leafIndex, leafValue);

    let randomLevel = randomInteger(0, DEFAULT_HEIGHT);
    let randomIndex = 0n;

    if (i % 2 === 0) {
      randomIndex = randomBigInt(0n, merkleTree.leafCount);
    } else {
      const position = randomInteger(1, avaiableIndexies.length);
      randomIndex = avaiableIndexies[position];
    }

    avaiableIndexies.push(leafIndex);

    const expectedResult = expectedMerkleTree.getNode(randomLevel, randomIndex);
    const actualResult = await merkleTree.getNode(randomLevel, randomIndex);

    let isZero = Bool(false);
    for (const zero of zeroes) {
      if (expectedResult.equals(Field(zero)).toBoolean()) {
        isZero = Bool(true);
        break;
      }
    }
    Circuit.log('is zero', isZero);
    Circuit.log('expectedResult', expectedResult);
    Circuit.log('actualResult', actualResult);

    isPassed = isPassed.and(expectedResult.equals(actualResult));

    if (isPassed.not().toBoolean()) {
      break;
    }
  }

  //Verify
  Circuit.log('getNodeTest is passed', isPassed);
}

async function getSetLeafMerkleTreeTest(
  merkleTree: BaseMerkleTree,
  expectedMerkleTree: MerkleTree
) {
  console.log('set leaf');
  // Setup
  const LEAF_AMOUNT = 20;

  // Execute
  for (let i = 0; i < LEAF_AMOUNT; i++) {
    const leafIndex = randomBigInt(0n, merkleTree.leafCount);
    const leafValue = Poseidon.hash(Field(leafIndex).toFields());
    await merkleTree.setLeaf(leafIndex, leafValue);
    expectedMerkleTree.setLeaf(leafIndex, leafValue);
  }

  //Verify
  const actualResult: TMerkleNodesMap = await merkleTree.getNodes();
  const expectedResult: TMerkleNodesMap = JSON.parse(
    JSON.stringify(expectedMerkleTree)
  ).nodes;

  Circuit.log('actualResult', actualResult);
  Circuit.log('expectedResult', expectedResult);

  console.log('add leaf is passed', verifyNodes(actualResult, expectedResult));
}

async function getFillMerkleTreeTest(
  merkleTree: BaseMerkleTree,
  expectedMerkleTree: MerkleTree
) {
  // Setup
  const LEAF_AMOUNT = 150;
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

  console.log('fill is passed', verifyNodes(actualResult, expectedResult));
}

function verifyNodes(
  actualNodeMap: TMerkleNodesMap,
  expectedNodeMap: TMerkleNodesMap
): boolean {
  const actualLevels = Object.keys(actualNodeMap).sort();
  const expectedLevels = Object.keys(expectedNodeMap).sort();

  if (actualLevels.length !== expectedLevels.length) {
    return false;
  }

  for (let i = 0; i < actualLevels.length; i++) {
    const level = actualLevels[i];
    if (level !== expectedLevels[i]) {
      console.log('actualLevels', level);
      console.log('expectedLevels', expectedLevels[i]);
      return false;
    }

    const actualNodes = actualNodeMap[level as unknown as number];
    const expectedNodes = expectedNodeMap[level as unknown as number];
    const actualNodeKeys = Object.keys(actualNodes).sort();
    const expectedNodeKeys = Object.keys(expectedNodes).sort();

    if (actualNodeKeys.length !== expectedNodeKeys.length) {
      console.log('actualNodeKeys.length', actualNodeKeys.length);
      console.log('expectedNodeKeys.length', expectedNodeKeys.length);
      return false;
    }

    for (let j = 0; j < actualNodeKeys.length; j++) {
      const nodeKey = actualNodeKeys[j];
      if (nodeKey !== expectedNodeKeys[j]) {
        Circuit.log('expected node key', expectedNodeKeys[j]);
        Circuit.log('actual node key', nodeKey);
        return false;
      }

      const actualField = Field(actualNodes[nodeKey]);
      const expectedField = expectedNodes[nodeKey];

      if (!actualField.equals(expectedField)) {
        // Circuit.log('expected field', expectedField);
        // Circuit.log('actual field', actualField);
        return false;
      }
    }
  }

  return true;
}
