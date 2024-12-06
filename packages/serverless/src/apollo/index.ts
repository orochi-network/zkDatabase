import {
  resolversCollectionIndex,
  typeDefsCollectionIndex,
} from './app/collection-index.js';
import { resolversCollection, typeDefsCollection } from './app/collection.js';
import { typeDefsCommon } from './app/common.js';
import { resolversDatabase, typeDefsDatabase } from './app/database.js';
// import { resolversDocument, typeDefsDocument } from './app/document.js';
import {
  resolversEnvironment,
  typeDefsEnvironment,
} from './app/environment.js';
// import { resolversGroup, typeDefsGroup } from './app/group.js';
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
  // typeDefsDocument,
  typeDefsCollectionIndex,
  typeDefsUser,
  // typeDefsGroup,
  typeDefsPermission,
  typeDefsMerkleTree,
  typeDefsProof,
  typeDefsTransaction,
  typeDefsRollUp,
  typeDefsEnvironment,
];

export const ResolversApp = [
  resolversDatabase,
  resolversCollection,
  // resolversDocument,
  resolversCollectionIndex,
  resolversUser,
  // resolversGroup,
  resolversPermission,
  resolversMerkleTree,
  resolversProof,
  resolversTransaction,
  resolversRollUp,
  resolversEnvironment,
];
