export type O1DataType =
  | 'UInt32'
  | 'UInt64'
  | 'Int64'
  | 'CircuitString'
  | 'MerkleMapWitness'
  | 'PrivateKey'
  | 'Signature'
  | 'PublicKey'
  | 'Character'
  | 'Sign';

export type O1Property = Record<O1DataType, string>;
