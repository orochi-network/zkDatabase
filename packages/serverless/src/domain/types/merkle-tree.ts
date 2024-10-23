export type MerkleNode = {
  hash: string;
  index: number;
  level: number;
  empty: boolean
};

export type MerkleTreeInfo = {
  merkleRoot: string;
  merkleHeight: number;
};
