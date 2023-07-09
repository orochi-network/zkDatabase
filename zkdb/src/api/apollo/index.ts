import { resolversDocument, typeDefsDocument } from './app/document.js';
import { resolversMerkleTree, typeDefsMerkleTree } from './app/merkle-tree.js';
import { typeDefsMetadata, resolversMetadata } from './app/metadata.js';

export const TypedefsApp = [
  typeDefsMetadata,
  typeDefsDocument,
  typeDefsMerkleTree,
];

export const ResolversApp = [
  resolversMetadata,
  resolversDocument,
  resolversMerkleTree,
];
