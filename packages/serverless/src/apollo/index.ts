import {
  resolversCollection,
  resolversCollectionIndex,
  resolversDatabase,
  resolversDocument,
  resolversGroup,
  resolversMerkleTree,
  resolversProof,
  resolversRollUp,
  resolversTransaction,
  resolversUser,
  typeDefsCollection,
  typeDefsCollectionIndex,
  typeDefsCommon,
  typeDefsDatabase,
  typeDefsDocument,
  typeDefsGroup,
  typeDefsMerkleTree,
  typeDefsProof,
  typeDefsRollUp,
  typeDefsTransaction,
  typeDefsUser,
} from './app';

export const TypedefsApp = [
  typeDefsCommon,
  typeDefsDatabase,
  typeDefsCollection,
  typeDefsDocument,
  typeDefsCollectionIndex,
  typeDefsUser,
  typeDefsGroup,
  typeDefsMerkleTree,
  typeDefsProof,
  typeDefsTransaction,
  typeDefsRollUp,
];

export const ResolversApp = [
  resolversDatabase,
  resolversCollection,
  resolversDocument,
  resolversCollectionIndex,
  resolversUser,
  resolversGroup,
  resolversMerkleTree,
  resolversProof,
  resolversTransaction,
  resolversRollUp,
];

export * from './validation';
