import * as app from './app';
import * as appTypes from './app/types';

export * from './app';
export * from './types';
export * from './mapper';
export * from './validation';

// Using the imported values directly
export const TypedefsApp = [
  app.typeDefsDatabase,
  app.typeDefsCollection,
  app.typeDefsDocument,
  app.typeDefsCollectionIndex,
  app.typeDefsUser,
  app.typeDefsGroup,
  app.typeDefsPermission,
  app.typeDefsMerkleTree,
  app.typeDefsProof,
  app.typeDefsDocumentHistory,
  appTypes.typeCommonDefsDocument,
  appTypes.typeCommonDefsCollection,
  appTypes.typeCommonDefsMetadata,
];

export const ResolversApp = [
  app.resolversDatabase,
  app.resolversCollection,
  app.resolversDocument,
  app.resolversCollectionIndex,
  app.resolversUser,
  app.resolversGroup,
  app.resolversPermission,
  app.resolversMerkleTree,
  app.resolversProof,
  app.resolversDocumentHistory,
];
