import { withCompoundTransaction, withTransaction } from '@zkdb/storage';
import GraphQLJSON from 'graphql-type-json';
import Joi from 'joi';
import { Document, DocumentHistory } from '@domain';
import { gql } from '@helper';
import { authorizeWrapper } from '../validation';
import {
  collectionName,
  databaseName,
  documentRecord as schemaDocumentRecord,
  pagination,
  TDocumentCreateRequest,
  TDocumentListRequest,
  TDocumentFindRequest,
  TDocumentUpdateRequest,
  TDocumentHistoryFindRequest,
  TDocumentHistoryListRequest,
  TWithProofStatus,
  TDocumentWithMetadataResponse,
  TDocumentRecordNullable,
  TDocumentHistoryListResponse,
  TDocumentModificationResponse,
  TDocumentHistoryResponse,
} from '@zkdb/common';

import { DEFAULT_PAGINATION } from '@common';
import { Permission } from '@zkdb/permission';

export const JOI_DOCUMENT_FIND_REQUEST = Joi.object<TDocumentFindRequest>({
  databaseName,
  collectionName,
  query: Joi.object(),
});

export const JOI_DOCUMENT_LIST_REQUEST = Joi.object<TDocumentListRequest>({
  databaseName,
  collectionName,
  query: Joi.object(),
  pagination,
});

export const JOI_DOCUMENT_CREATE_REQUEST = Joi.object<
  TDocumentCreateRequest,
  true
>({
  databaseName,
  collectionName,
  documentPermission: Joi.number().min(0).max(0xffffff).required(),

  // TODO: need testing
  document: schemaDocumentRecord,
});

export const JOI_DOCUMENT_UPDATE_REQUEST = Joi.object<TDocumentUpdateRequest>({
  databaseName,
  collectionName,
  query: Joi.object(),

  // TODO: need testing
  document: schemaDocumentRecord,
});

export const JOI_DOCUMENT_HISTORY_FIND_REQUEST =
  Joi.object<TDocumentHistoryFindRequest>({
    databaseName,
    collectionName,
    docId: Joi.string(),
  });

export const JOI_DOCUMENT_HISTORY_LIST_REQUEST =
  Joi.object<TDocumentHistoryListRequest>({
    databaseName,
    collectionName,
    pagination,
  });

export const typeDefsDocument = gql`
  #graphql
  scalar JSON
  type Query
  type Mutation

  type MerkleProof {
    isLeft: Boolean!
    sibling: String!
  }

  type ListDocumentWithMetadataResponse {
    document: DocumentResponse!
    metadata: MetadataDocumentResponse!
    proofStatus: String
  }

  type DocumentHistoryResponse {
    docId: String!
    documentRevision: [DocumentResponse!]!
    metadata: MetadataDocumentResponse!
    active: Boolean!
  }

  type DocumentResponse {
    docId: String!
    document: JSON
    createdAt: Date
  }

  extend type Query {
    findDocument(
      databaseName: String!
      collectionName: String!
      query: JSON!
    ): DocumentResponse

    listDocumentWithMetadata(
      databaseName: String!
      collectionName: String!
      query: JSON!
      pagination: PaginationInput
    ): [ListDocumentWithMetadataResponse]!

    findDocumentHistory(
      databaseName: String!
      collectionName: String!
      docId: String
    ): DocumentHistoryResponse

    listDocumentHistory(
      databaseName: String!
      collectionName: String!
      docId: String
      pagination: PaginationInput
    ): [DocumentHistoryResponse]!
  }

  extend type Mutation {
    createDocument(
      databaseName: String!
      collectionName: String!
      document: [SchemaFieldInput!]!
      documentPermission: Int
    ): [MerkleProof!]!

    updateDocument(
      databaseName: String!
      collectionName: String!
      query: JSON!
      document: [SchemaFieldInput!]!
    ): [MerkleProof!]!

    dropDocument(
      databaseName: String!
      collectionName: String!
      query: JSON!
    ): [MerkleProof!]!
  }
`;

// Query
const findDocument = authorizeWrapper<
  TDocumentFindRequest,
  TDocumentRecordNullable | null
>(JOI_DOCUMENT_FIND_REQUEST, async (_root: unknown, args, ctx) => {
  const document = await withTransaction((session) =>
    Document.findDocument(
      {
        databaseName: args.databaseName,
        collectionName: args.collectionName,
        actor: ctx.userName,
      },
      args.query,
      session
    )
  );

  return document;
});

const listDocumentWithMetadata = authorizeWrapper<
  TDocumentListRequest,
  TWithProofStatus<TDocumentWithMetadataResponse>[]
>(JOI_DOCUMENT_LIST_REQUEST, async (_root: unknown, args, ctx) => {
  const listDocument = await withTransaction(async (session) => {
    return Document.listDocumentWithMetadata(
      {
        databaseName: args.databaseName,
        collectionName: args.collectionName,
        actor: ctx.userName,
      },
      args.query,
      args.pagination || DEFAULT_PAGINATION,
      session
    );
  });

  if (listDocument == null) {
    throw new Error('Failed to list documents, transaction returned null');
  }

  return listDocument;
});

// Mutation
const createDocument = authorizeWrapper<
  TDocumentCreateRequest,
  TDocumentModificationResponse
>(
  JOI_DOCUMENT_CREATE_REQUEST,
  async (_root: unknown, args: TDocumentCreateRequest, ctx) =>
    withCompoundTransaction((compoundSession) =>
      Document.createDocument(
        {
          databaseName: args.databaseName,
          collectionName: args.collectionName,
          actor: ctx.userName,
        },
        args.document,
        Permission.from(args.documentPermission),
        compoundSession
      )
    )
);

const updateDocument = authorizeWrapper<
  TDocumentUpdateRequest,
  TDocumentModificationResponse
>(JOI_DOCUMENT_UPDATE_REQUEST, async (_root: unknown, args, ctx) => {
  return withTransaction((session) =>
    Document.updateDocument(
      {
        databaseName: args.databaseName,
        collectionName: args.collectionName,
        actor: ctx.userName,
      },
      args.query,
      args.document,
      session
    )
  );
});

const dropDocument = authorizeWrapper<
  TDocumentFindRequest,
  TDocumentModificationResponse
>(
  JOI_DOCUMENT_FIND_REQUEST,
  async (_root: unknown, args: TDocumentFindRequest, ctx) => {
    return Document.deleteDocument(
      {
        databaseName: args.databaseName,
        collectionName: args.collectionName,
        actor: ctx.userName,
      },
      args.query
    );
  }
);

const findDocumentHistory = authorizeWrapper<
  TDocumentHistoryFindRequest,
  TDocumentHistoryResponse | null
>(
  JOI_DOCUMENT_HISTORY_FIND_REQUEST,
  async (_root: unknown, args: TDocumentHistoryFindRequest, ctx) => {
    return withTransaction((session) =>
      DocumentHistory.find(
        {
          databaseName: args.databaseName,
          collectionName: args.collectionName,
          actor: ctx.userName,
          docId: args.docId,
        },
        session
      )
    );
  }
);

const listDocumentHistory = authorizeWrapper<
  TDocumentHistoryListRequest,
  TDocumentHistoryListResponse
>(JOI_DOCUMENT_HISTORY_LIST_REQUEST, async (_root: unknown, args, ctx) => {
  return withTransaction(async (session) => {
    const documents = await DocumentHistory.list(
      {
        databaseName: args.databaseName,
        collectionName: args.collectionName,
        actor: ctx.userName,
        docId: args.docId,
      },
      args.pagination || DEFAULT_PAGINATION,
      session
    );

    return documents;
  });
});

export const resolversDocument = {
  JSON: GraphQLJSON,
  Query: {
    findDocument,
    listDocumentWithMetadata,
    findDocumentHistory,
    listDocumentHistory,
  },
  Mutation: {
    createDocument,
    updateDocument,
    dropDocument,
  },
};
