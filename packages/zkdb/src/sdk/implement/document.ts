import { IApiClient } from '@zkdb/api';
import {
  TDocumentDropResponse,
  TDocumentField,
  TDocumentHistoryFindResponse,
  TDocumentMetadata,
  TDocumentResponse,
  TDocumentUpdateResponse,
  TMerkleProofDocumentResponse,
  TMerkleTreeProofByDocIdResponse,
  TPagination,
  TSchemaExtendable,
  TSerializedValue,
  TZkProofDocumentResponse,
} from '@zkdb/common';
import { IDocument, IMetadata, TDocument } from '../interfaces';
import { DocumentMetadata } from './document-metadata';
import { serializeDocument } from '../helper/serialize';

export class Document<T extends TSchemaExtendable<any>>
  implements IDocument<T>
{
  private apiClient: IApiClient;

  private databaseName: string;

  private collectionName: string;

  private _document: TDocument;

  private _innerDocument: Record<string, TDocumentField>;

  private get basicRequest() {
    return {
      databaseName: this.databaseName,
      collectionName: this.collectionName,
      docId: this._document.docId,
    };
  }

  constructor(
    apiClient: IApiClient,
    databaseName: string,
    collectionName: string,
    document: TDocumentResponse
  ) {
    this.databaseName = databaseName;
    this.collectionName = collectionName;
    this.apiClient = apiClient;
    const { docId, createdAt, updatedAt } = document;
    this._document = {
      docId,
      createdAt:
        typeof createdAt === 'string' ? new Date(createdAt) : createdAt,
      updatedAt:
        typeof updatedAt === 'string' ? new Date(updatedAt) : updatedAt,
    } as any;
    this._innerDocument = document.document;
  }

  get document(): TDocument & T['innerStructure'] {
    const flatDocument: T['innerStructure'] = Object.entries(
      this._innerDocument
    ).reduce((accumulate, previousValue) => {
      const [key, fieldValue] = previousValue;
      return {
        ...accumulate,
        [key]: fieldValue.value,
      };
    }, {});

    return { ...this._document, ...flatDocument };
  }

  get metadata(): IMetadata<TDocumentMetadata> {
    return new DocumentMetadata(
      this.apiClient,
      this.databaseName,
      this.collectionName,
      this._document.docId
    );
  }

  async drop(): Promise<TDocumentDropResponse> {
    return (
      await this.apiClient.document.documentDrop(this.basicRequest)
    ).unwrap();
  }

  async update(
    document: Partial<T['innerStructure']>
  ): Promise<TDocumentUpdateResponse> {
    return (
      await this.apiClient.document.documentUpdate({
        ...this.basicRequest,
        document: serializeDocument(document) as Record<
          string,
          TSerializedValue
        >,
      })
    ).unwrap();
  }

  toProvable(schema: T): InstanceType<T> {
    const schemaDefinition = schema.definition();
    const document = schemaDefinition.map(({ name, kind }) => {
      return {
        name,
        kind,
        value: this._innerDocument[name].value,
      };
    });
    // @NOTICE: Force type cast
    return schema.deserialize(document as any);
  }

  async merkleProof(): Promise<TMerkleTreeProofByDocIdResponse> {
    return (
      await this.apiClient.merkle.merkleProofDocId(this.basicRequest)
    ).unwrap();
  }

  async merkleProofStatus(): Promise<TMerkleProofDocumentResponse> {
    return (
      await this.apiClient.proof.documentMerkleProofStatus(this.basicRequest)
    ).unwrap();
  }

  async zkProofStatus(): Promise<TZkProofDocumentResponse> {
    return (
      await this.apiClient.proof.documentZkProofStatus(this.basicRequest)
    ).unwrap();
  }

  async history(
    pagination?: TPagination
  ): Promise<TDocumentHistoryFindResponse> {
    return (
      await this.apiClient.document.documentHistoryFind({
        ...this.basicRequest,
        pagination,
      })
    ).unwrap();
  }
}
