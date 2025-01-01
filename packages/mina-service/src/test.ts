import { config } from '@helper';
import { DatabaseEngine, ModelMerkleTree, ModelQueueTask } from '@zkdb/storage';
import { Field, Poseidon } from 'o1js';

(async () => {
  const serverlessDb = DatabaseEngine.getInstance(config.MONGODB_URL);
  const proofDb = DatabaseEngine.getInstance(config.PROOF_MONGODB_URL);

  if (!serverlessDb.isConnected()) {
    await serverlessDb.connect();
  }

  if (!proofDb.isConnected()) {
    await proofDb.connect();
  }

  const databaseName = 'inflammatio0';

  const imQueue = ModelQueueTask.getInstance();

  //   console.log(
  //     await imQueue.find({ databaseName }).sort({ createdAt: -1 }).toArray()
  //   );

  //   console.log(
  //     await imProof.find({ databaseName }).sort({ createdAt: -1 }).toArray()
  //   );

  const imMerkleTree = await ModelMerkleTree.getInstance(databaseName);

  const nodeList = await imMerkleTree
    .find({})
    .sort({ level: 1, index: 1 })
    .toArray();

  const leaves: Field[] = [];
  const hashes: Field[] = [];
  const levels: number[] = [];
  const indices: bigint[] = [];

  nodeList.forEach((node) => {
    leaves.push(new Field(node.leaf));
    hashes.push(new Field(node.hash));
    levels.push(node.level);
    indices.push(node.index);
  });

  console.log('🚀 ~ leaves:', leaves);
  console.log('🚀 ~ hashes:', hashes);
  console.log('🚀 ~ levels:', levels);
  console.log('🚀 ~ indices:', indices);

  const zkdbMerkleRoot = await imMerkleTree.getRoot(new Date());
  console.log(zkdbMerkleRoot.toString());
  console.log(
    'is valid merkle tree ',
    verifyMerkleTree(leaves, hashes, levels, indices, zkdbMerkleRoot)
  );
})();

function verifyMerkleTree(
  leaves: Field[],
  hashes: Field[],
  level: number[],
  indices: bigint[],
  targetMerkleRoot: Field
): boolean {
  // Check leaf and hash length the same
  if (leaves.length !== indices.length) return false;

  // hash leaf to compare with hash that we store
  for (let i = 0; i < leaves.length; i++) {
    const leafHash = Poseidon.hash([leaves[i]]);
    if (!leafHash.equals(hashes[i])) return false; // compare each hash
  }

  // Travel from leaf to root
  let currentLevelHashes = hashes;
  for (let lvl = 0; lvl < Math.max(...level); lvl++) {
    const nextLevelHashes: Field[] = [];
    for (let i = 0; i < currentLevelHashes.length; i += 2) {
      const left = currentLevelHashes[i];
      const right = currentLevelHashes[i + 1] || currentLevelHashes[i];
      const parentHash = Poseidon.hash([left, right]);
      nextLevelHashes.push(parentHash);
    }
    currentLevelHashes = nextLevelHashes;
  }

  // Compare Merkle Root

  const expectedRoot = currentLevelHashes[currentLevelHashes.length - 1];
  console.log(
    `expected root: `,
    expectedRoot.toString(),
    `got: ${targetMerkleRoot.toString()}`
  );
  return targetMerkleRoot.equals(expectedRoot).toBoolean();
}
