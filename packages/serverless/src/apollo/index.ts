import { resolversDatabase, typeDefsDatabase } from './app/database';
import { resolversCollection, typeDefsCollection } from './app/collection';
import { resolversDocument, typeDefsDocument } from './app/document';
import { resolversCollectionIndex, typeDefsCollectionIndex } from './app/collection-index';

export const TypedefsApp = [typeDefsDatabase, typeDefsCollection, typeDefsDocument, typeDefsCollectionIndex];

export const ResolversApp = [resolversDatabase, resolversCollection, resolversDocument, resolversCollectionIndex];
