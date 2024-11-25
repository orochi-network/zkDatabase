import {
  resolversCollectionIndex,
  typeDefsCollectionIndex,
} from './app/collection-index.js';
import { resolversCollection, typeDefsCollection } from './app/collection.js';
import { resolversDatabase, typeDefsDatabase } from './app/database.js';
import {
  resolversDocumentHistory,
  typeDefsDocumentHistory,
} from './app/document-history.js';
import { resolversDocument, typeDefsDocument } from './app/document.js';
import {
  resolversEnvironment,
  typeDefsEnvironment,
} from './app/environment.js';
import { resolversGroup, typeDefsGroup } from './app/group.js';
import { resolversMerkleTree, typeDefsMerkleTree } from './app/merkle-tree.js';
import { resolversPermission, typeDefsPermission } from './app/metadata.js';
import { resolversProof, typeDefsProof } from './app/proof.js';
import { resolversRollUp, typeDefsRollUp } from './app/rollup.js';
import {
  resolversTransaction,
  typeDefsTransaction,
} from './app/transaction.js';
import { typeCommonDefsCollectionIndex } from './app/types/collection-index.js';
import { typeCommonDefsCollection } from './app/types/collection.js';
import { typeCommonDefsDocument } from './app/types/document.js';
import { typeCommonDefsMetadata } from './app/types/metadata.js';
import { typeCommonDefsTransaction } from './app/types/transaction.js';
import { resolversUser, typeDefsUser } from './app/user.js';

export const TypedefsApp = [
  typeDefsDatabase,
  typeDefsCollection,
  typeDefsDocument,
  typeDefsCollectionIndex,
  typeDefsUser,
  typeDefsGroup,
  typeDefsPermission,
  typeDefsMerkleTree,
  typeDefsProof,
  typeDefsDocumentHistory,
  typeDefsTransaction,
  typeDefsRollUp,
  typeCommonDefsDocument,
  typeCommonDefsCollection,
  typeCommonDefsMetadata,
  typeCommonDefsCollectionIndex,
  typeCommonDefsTransaction,
  typeDefsEnvironment,
];

type Resolver =
  | typeof resolversDatabase
  | typeof resolversCollection
  | typeof resolversDocument
  | typeof resolversCollectionIndex
  | typeof resolversUser
  | typeof resolversGroup
  | typeof resolversPermission
  | typeof resolversMerkleTree
  | typeof resolversProof
  | typeof resolversDocumentHistory
  | typeof resolversTransaction
  | typeof resolversRollUp
  | typeof resolversEnvironment;

export const ResolversApp: Resolver[] = [
  resolversDatabase,
  resolversCollection,
  resolversDocument,
  resolversCollectionIndex,
  resolversUser,
  resolversGroup,
  resolversPermission,
  resolversMerkleTree,
  resolversProof,
  resolversDocumentHistory,
  resolversTransaction,
  resolversRollUp,
  resolversEnvironment,
];
