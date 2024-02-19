/**
 * This file handle data convertion between zkDatabase and o1js
 */

export type TO1DataType =
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
