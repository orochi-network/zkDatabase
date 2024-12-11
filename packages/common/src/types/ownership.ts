import { TCollectionRequest } from './collection.js';
import { TDbRecord } from './common.js';

export type TOwnership = {
  databaseName: string;
  owner: string;
};

export type TOwnershipRecord = TDbRecord<TOwnership>;

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
