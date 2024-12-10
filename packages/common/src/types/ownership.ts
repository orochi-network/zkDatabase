import { TCollectionRequest } from './collection.js';

/**
 * Ownership types
 * @typedef {Object} OwnershipType
 * @property {number} User - User ownership type
 * @property {number} Group - Group ownership type
 * @readonly
 */
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
