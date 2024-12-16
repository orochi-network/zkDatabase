import { withCompoundTransaction, withTransaction } from '@zkdb/storage';
import GraphQLJSON from 'graphql-type-json';
import Joi from 'joi';
import {
  createDocument as createDocumentImpl,
  deleteDocument,
  listDocumentWithMetadata as listDocumentWithMetadataImpl,
  findDocument as findDocumentImpl,
  updateDocument as updateDocumentImpl,
} from '../../domain/use-case/document.js';
import {
  findDocumentHistory as findDocumentHistoryImpl,
  listDocumentHistory as listDocumentHistoryImpl,
} from '../../domain/use-case/document-history.js';
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
  TDocumentHistoryResponse,
  TMerkleProof,
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

  type TListDocumentWithMetadata {
    document: TDocumentReadResponse!
    metadata: TMetadataDocument!
    proofStatus: String
  }

  type TDocumentHistoryResponse {
    docId: String!
    documents: [TDocumentReadResponse!]!
  }

  type TDocumentReadResponse {
    docId: String!
    document: [TDocumentField!]!
    createdAt: Date
  }

  type TDocumentField {
    name: String!
    kind: String!
    value: String!
  }

  extend type Query {
    findDocument(
      databaseName: String!
      collectionName: String!
      query: JSON!
    ): TDocumentReadResponse

    listDocumentWithMetadata(
      databaseName: String!
      collectionName: String!
      query: JSON!
      pagination: PaginationInput
    ): [TListDocumentWithMetadata]!

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
    findDocumentImpl(
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
>(
  // TODO: consider validating this
  Joi.object().optional(),
  async (_root: unknown, args, ctx) => {
    const documents = await withTransaction(async (session) => {
      return listDocumentWithMetadataImpl(
        args.databaseName,
        args.collectionName,
        ctx.userName,
        args.query,
        args.pagination || DEFAULT_PAGINATION,
        session
      );
    });

    if (documents == null) {
      throw new Error('Failed to list documents, transaction returned null');
    }

    return documents;
  }
);

// Mutation
const createDocument = authorizeWrapper<
  TDocumentCreateRequest,
  TMerkleProof[] | null
>(
  JOI_DOCUMENT_CREATE_REQUEST,
  async (_root: unknown, args: TDocumentCreateRequest, ctx) =>
    withCompoundTransaction((compoundSession) =>
      createDocumentImpl(
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

const updateDocument = authorizeWrapper(
  JOI_DOCUMENT_UPDATE_REQUEST,
  async (_root: unknown, args: TDocumentUpdateRequest, ctx) => {
    return updateDocumentImpl(
      {
        databaseName: args.databaseName,
        collectionName: args.collectionName,
        actor: ctx.userName,
      },
      args.query,
      args.document
    );
  }
);

const dropDocument = authorizeWrapper(
  JOI_DOCUMENT_FIND_REQUEST,
  async (_root: unknown, args: TDocumentFindRequest, ctx) => {
    return deleteDocument(
      {
        databaseName: args.databaseName,
        collectionName: args.collectionName,
        actor: ctx.userName,
      },
      args.query
    );
  }
);

const findDocumentHistory = authorizeWrapper(
  JOI_DOCUMENT_HISTORY_FIND_REQUEST,
  async (_root: unknown, args: TDocumentHistoryFindRequest, ctx) => {
    return withTransaction((session) =>
      findDocumentHistoryImpl(
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
  TDocumentHistoryResponse[]
  // TODO: validate input
>(Joi.object().optional(), async (_root: unknown, args, ctx) => {
  return withTransaction(async (session) => {
    const documents = await listDocumentHistoryImpl(
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
