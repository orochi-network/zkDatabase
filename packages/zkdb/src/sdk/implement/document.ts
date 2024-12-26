import { IApiClient } from '@zkdb/api';
import {
  TDocumentHistoryFindResponse,
  TDocumentMetadata,
  TDocumentUpdateResponse,
  TMerkleProof,
  TPagination,
  TProofStatusDocumentRequest,
  TSchemaExtendable,
} from '@zkdb/common';
import { IDocument, IMetadata, TDocument } from '../interfaces';

export class DocumentMetadata implements IMetadata<TDocumentMetadata> {
  private databaseName: string;
  private collectionName: string;
  private docId: string;
  private apiClient: IApiClient;

  constructor(
    apiClient: IApiClient,
    databaseName: string,
    collectionName: string,
    docId: string
  ) {
    this.databaseName = databaseName;
    this.collectionName = collectionName;
    this.docId = docId;
    this.apiClient = apiClient;
  }
}

export class Document<T extends TSchemaExtendable<any>>
  implements IDocument<T>
{
  get document(): TDocument<T['innerStructure']> {
    throw new Error('Method not implemented.');
  }
  get metadata(): IMetadata<TDocumentMetadata> {
    throw new Error('Method not implemented.');
  }
  drop(): Promise<TMerkleProof> {
    throw new Error('Method not implemented.');
  }
  update(
    document: Partial<T['innerStructure']>
  ): Promise<TDocumentUpdateResponse> {
    throw new Error('Method not implemented.');
  }
  toProvable(type: T): InstanceType<T> {
    throw new Error('Method not implemented.');
  }
  proofMerkle(): Promise<TMerkleProof[]> {
    throw new Error('Method not implemented.');
  }
  proofStatus(): Promise<TProofStatusDocumentRequest> {
    throw new Error('Method not implemented.');
  }
  history(pagination?: TPagination): Promise<TDocumentHistoryFindResponse[]> {
    throw new Error('Method not implemented.');
  }
}
