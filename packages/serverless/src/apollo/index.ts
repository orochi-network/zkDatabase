import { resolversDatabase, typeDefsDatabase } from './app/database';
import { resolversCollection, typeDefsCollection } from './app/collection';
import { resolversDocument, typeDefsDocument } from './app/document';
import {
  resolversCollectionIndex,
  typeDefsCollectionIndex,
} from './app/collection-index';
import { resolversLogin, typeDefsLogin } from './app/login';

export const TypedefsApp = [
  typeDefsDatabase,
  typeDefsCollection,
  typeDefsDocument,
  typeDefsCollectionIndex,
  typeDefsLogin,
];

export const ResolversApp = [
  resolversDatabase,
  resolversCollection,
  resolversDocument,
  resolversCollectionIndex,
  resolversLogin,
];
