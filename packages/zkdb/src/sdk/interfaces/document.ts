/* eslint-disable no-unused-vars */
import {
  TDocumentHistoryFindResponse,
  TDocumentMetadata,
  TDocumentRecord,
  TDocumentUpdateResponse,
  TMerkleProof,
  TPagination,
  TProofStatusDocumentRequest,
  TSchemaExtendable,
} from '@zkdb/common';
import { IMetadata } from './metadata';

export type TDocument<T> = Pick<
  TDocumentRecord,
  'docId' | 'createdAt' | 'updatedAt'
> &
  T;

export interface IDocument<T extends TSchemaExtendable<any>> {
  get document(): TDocument<T['innerStructure']>;

  get metadata(): IMetadata<TDocumentMetadata>;

  drop(): Promise<TMerkleProof>;

  update(
    document: Partial<T['innerStructure']>
  ): Promise<TDocumentUpdateResponse>;

  toProvable(type: T): InstanceType<T>;

  proofMerkle(): Promise<TMerkleProof[]>;

  proofStatus(): Promise<TProofStatusDocumentRequest>;

  history(pagination?: TPagination): Promise<TDocumentHistoryFindResponse[]>;
}
