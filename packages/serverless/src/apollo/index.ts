import { resolversDatabase, typeDefsDatabase } from './app/database.js';
import { resolversCollection, typeDefsCollection } from './app/collection.js';
import { resolversDocument, typeDefsDocument } from './app/document.js';
import {
  resolversCollectionIndex,
  typeDefsCollectionIndex,
} from './app/collection-index';
import { resolversUser, typeDefsUser } from './app/user.js';
import { resolversGroup, typeDefsGroup } from './app/group.js';
import { resolversPermission, typeDefsPermission } from './app/metadata.js';
import { resolversMerkleTree, typeDefsMerkleTree } from './app/merkle-tree.js';
import { resolversAggregation, typeDefsAggregation } from './app/aggregation.js';

export const TypedefsApp = [
  typeDefsDatabase,
  typeDefsCollection,
  typeDefsDocument,
  typeDefsCollectionIndex,
  typeDefsUser,
  typeDefsGroup,
  typeDefsPermission,
  typeDefsMerkleTree,
  typeDefsAggregation
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
  | typeof resolversAggregation

export const ResolversApp: Resolver[] = [
  resolversDatabase,
  resolversCollection,
  resolversDocument,
  resolversCollectionIndex,
  resolversUser,
  resolversGroup,
  resolversPermission,
  resolversMerkleTree,
  resolversAggregation
];
