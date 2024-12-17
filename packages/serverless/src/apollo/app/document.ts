import { withCompoundTransaction, withTransaction } from '@zkdb/storage';
import GraphQLJSON from 'graphql-type-json';
import Joi from 'joi';
import { Document } from '../../domain/use-case/document.js';
import { DocumentHistory } from '../../domain/use-case/document-history.js';
import { gql } from '../../helper/common.js';
import { authorizeWrapper } from '../validation.js';
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

import { DEFAULT_PAGINATION } from '../../common/const.js';
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

  type TMerkleProof {
    isLeft: Boolean!
    sibling: String!
  }

  type TListDocumentWithMetadataResponse {
    document: TDocumentResponse!
    metadata: TMetadataDocument!
    proofStatus: String
  }

  type TDocumentHistoryResponse {
    docId: String!
    documentRevision: [TDocumentRecordNullable!]!
    metadata: TMetadataDocument!
    active: Boolean!
  }

  type TDocumentResponse {
    docId: String!
    document: JSON
    createdAt: Date
  }

  extend type Query {
    findDocument(
      databaseName: String!
      collectionName: String!
      query: JSON!
    ): TDocumentResponse

    listDocumentWithMetadata(
      databaseName: String!
      collectionName: String!
      query: JSON!
      pagination: PaginationInput
    ): [TListDocumentWithMetadataResponse]!

    findDocumentHistory(
      databaseName: String!
      collectionName: String!
      docId: String
    ): TDocumentHistoryResponse

    listDocumentHistory(
      databaseName: String!
      collectionName: String!
      docId: String
      pagination: PaginationInput
    ): [TDocumentHistoryResponse]!
  }

  extend type Mutation {
    createDocument(
      databaseName: String!
      collectionName: String!
      document: [SchemaFieldInput!]!
      documentPermission: Int
    ): [TMerkleProof!]!

    updateDocument(
      databaseName: String!
      collectionName: String!
      query: JSON!
      document: [SchemaFieldInput!]!
    ): [TMerkleProof!]!

    dropDocument(
      databaseName: String!
      collectionName: String!
      query: JSON!
    ): [TMerkleProof!]!
  }
`;

// Query
const findDocument = authorizeWrapper<
  TDocumentFindRequest,
  TDocumentRecordNullable | null
>(JOI_DOCUMENT_FIND_REQUEST, async (_root: unknown, args, ctx) => {
  const document = await withTransaction((session) =>
    Document.findDocument(
      args.databaseName,
      args.collectionName,
      ctx.userName,
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
      args.databaseName,
      args.collectionName,
      ctx.userName,
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
  return Document.updateDocument(
    {
      databaseName: args.databaseName,
      collectionName: args.collectionName,
      actor: ctx.userName,
    },
    args.query,
    args.document
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
      DocumentHistory.findDocumentHistory(
        args.databaseName,
        args.collectionName,
        ctx.userName,
        args.docId,
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
    const documents = await DocumentHistory.listDocumentHistory(
      args.databaseName,
      args.collectionName,
      args.docId,
      ctx.userName,
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
