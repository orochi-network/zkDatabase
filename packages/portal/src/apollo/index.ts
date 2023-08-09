import { resolversDocument, typeDefsDocument } from './app/document.js';
import { resolversMerkleTree, typeDefsMerkleTree } from './app/merkle-tree.js';

export const TypedefsApp = [typeDefsDocument, typeDefsMerkleTree];

export const ResolversApp = [resolversDocument, resolversMerkleTree];
