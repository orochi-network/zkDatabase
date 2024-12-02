export type TMerkleNode = {
  hash: string;
  index: number;
  level: number;
  empty: boolean;
};

export type TMerkleTreeInfo = {
  merkleRoot: string;
  merkleHeight: number;
};
