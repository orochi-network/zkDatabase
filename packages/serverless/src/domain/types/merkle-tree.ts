export type MerkleNode = {
  hash: string,
  index: number,
  level: number
}

export type MerkleTreeInfo = {
  merkleRoot: string,
  merkleHeight: number
}