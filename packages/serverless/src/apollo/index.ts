import {
  resolversCollectionIndex,
  typeDefsCollectionIndex,
} from './app/collection-index.js';
import { resolversCollection, typeDefsCollection } from './app/collection.js';
import { typeDefsCommon } from './app/common.js';
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
import { resolversUser, typeDefsUser } from './app/user.js';

export const TypedefsApp = [
  typeDefsCommon,
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
