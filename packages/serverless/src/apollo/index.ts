import { resolversDatabase, typeDefsDatabase } from './app/database';
import { resolversCollection, typeDefsCollection } from './app/collection';
import { resolversDocument, typeDefsDocument } from './app/document';
import {
  resolversCollectionIndex,
  typeDefsCollectionIndex,
} from './app/collection-index';
import { resolversUser, typeDefsUser } from './app/user';
import { resolversGroup, typeDefsGroup } from './app/group';

export const TypedefsApp = [
  typeDefsDatabase,
  typeDefsCollection,
  typeDefsDocument,
  typeDefsCollectionIndex,
  typeDefsUser,
  typeDefsGroup,
];

export const ResolversApp = [
  resolversDatabase,
  resolversCollection,
  resolversDocument,
  resolversCollectionIndex,
  resolversUser,
  resolversGroup,
];
