import { TCollectionRequest } from './collection.js';

export enum EOwnershipType {
  User = 'User',
  Group = 'Group',
}

export type TOwnershipDocumentRequest = TCollectionRequest & {
  docId: string;
};

export type TOwnershipDocumentUpdateRequest = TOwnershipDocumentRequest & {
  permission: number;
};

export type TOwnershipDocumentOwnRequest = TOwnershipDocumentRequest & {
  groupType: EOwnershipType;
  newOwner: string;
};
