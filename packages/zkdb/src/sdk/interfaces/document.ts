/* eslint-disable no-unused-vars */
import {
  TDocumentDropResponse,
  TDocumentHistoryFindResponse,
  TDocumentMetadata,
  TDocumentRecord,
  TDocumentUpdateResponse,
  TMerkleTreeProofByDocIdResponse,
  TPagination,
  TProofStatusDocumentResponse,
  TSchemaExtendable,
} from '@zkdb/common';
import { IMetadata } from './metadata';

export type TDocument = Pick<
  TDocumentRecord,
  'docId' | 'createdAt' | 'updatedAt'
>;

export interface IDocument<T extends TSchemaExtendable<any>> {
  get document(): TDocument & T['innerStructure'];

  get metadata(): IMetadata<TDocumentMetadata>;

  drop(): Promise<TDocumentDropResponse>;

  update(
    document: Partial<T['innerStructure']>
  ): Promise<TDocumentUpdateResponse>;

  toProvable(schema: T): InstanceType<T>;

  merkleProof(): Promise<TMerkleTreeProofByDocIdResponse>;

  merkleProofStatus(): Promise<TProofStatusDocumentResponse>;

  history(pagination?: TPagination): Promise<TDocumentHistoryFindResponse>;
}
