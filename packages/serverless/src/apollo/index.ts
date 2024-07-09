import { resolversDatabase, typeDefsDatabase } from './app/database';
import { resolversCollection, typeDefsCollection } from './app/collection';
import { resolversDocument, typeDefsDocument } from './app/document';
import {
  resolversCollectionIndex,
  typeDefsCollectionIndex,
} from './app/collection-index';
import { resolversUser, typeDefsUser } from './app/user';
import { resolversGroup, typeDefsGroup } from './app/group';
import { resolversPermission, typeDefsPermission } from './app/metadata';
import { resolversMerkleTree, typeDefsMerkleTree } from './app/merkle-tree';

export const TypedefsApp = [
  typeDefsDatabase,
  typeDefsCollection,
  typeDefsDocument,
  typeDefsCollectionIndex,
  typeDefsUser,
  typeDefsGroup,
  typeDefsPermission,
  typeDefsMerkleTree,
];

type Resolver =
  | typeof resolversDatabase
  | typeof resolversCollection
  | typeof resolversDocument
  | typeof resolversCollectionIndex
  | typeof resolversUser
  | typeof resolversGroup
  | typeof resolversPermission
  | typeof resolversMerkleTree;

export const ResolversApp: Resolver[] = [
  resolversDatabase,
  resolversCollection,
  resolversDocument,
  resolversCollectionIndex,
  resolversUser,
  resolversGroup,
  resolversPermission,
  resolversMerkleTree,
];
