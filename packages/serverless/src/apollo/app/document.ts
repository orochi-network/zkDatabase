import { withCompoundTransaction, withTransaction } from '@zkdb/storage';
import GraphQLJSON from 'graphql-type-json';
import Joi from 'joi';
import {
  createDocument as createDocumentImpl,
  deleteDocument,
  findDocumentWithMetadata,
  findDocument as findDocumentImpl,
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
  documentField,
  pagination,
  TDocumentCreateRequest,
  TDocumentListRequest,
  TDocumentFindRequest,
  TDocumentUpdateRequest,
  TDocumentHistoryFindRequest,
  TDocumentHistoryListRequest,
  TPaginationReturn,
  TWithProofStatus,
  TDocumentWithMetadataResponse,
  TDocumentHistoryListResponse,
  documentRecord as schemaDocumentRecord,
} from '@zkdb/common';

import { DEFAULT_PAGINATION } from '../../common/const.js';

export const SCHEMA_DOCUMENT_FIND_REQUEST = Joi.object<TDocumentFindRequest>({
  databaseName,
  collectionName,
  query: Joi.object(),
});

export const SCHEMA_DOCUMENT_LIST_REQUEST = Joi.object<TDocumentListRequest>({
  databaseName,
  collectionName,
  query: Joi.object(),
  pagination,
});

export const SCHEMA_DOCUMENT_CREATE_REQUEST = Joi.object<
  TDocumentCreateRequest,
  true
>({
  databaseName,
  collectionName,
  documentPermission: Joi.number().min(0).max(0xffffff).required(),

  // TODO: need testing
  document: schemaDocumentRecord,
});

export const SCHEMA_DOCUMENT_UPDATE_REQUEST =
  Joi.object<TDocumentUpdateRequest>({
    databaseName,
    collectionName,
    query: Joi.object(),

    // TODO: need testing
    document: schemaDocumentRecord,
  });

export const SCHEMA_DOCUMENT_HISTORY_FIND_REQUEST =
  Joi.object<TDocumentHistoryFindRequest>({
    databaseName,
    collectionName,
    docId: Joi.string(),
  });

export const SCHEMA_DOCUMENT_HISTORY_LIST_REQUEST =
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

  type TListDocumentResponse {
    data: [TDocumentReadResponse]!
    totalSize: Int!
    offset: Int!
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

    listDocument(
      databaseName: String!
      collectionName: String!
      query: JSON!
      pagination: PaginationInput
    ): TListDocumentResponse!

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
  TDocumentFindResponse | null
>(SCHEMA_DOCUMENT_FIND_REQUEST, async (_root: unknown, args, ctx) => {
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

const listDocument = authorizeWrapper<
  TDocumentListRequest,
  TPaginationReturn<Array<TDocumentFindResponse>>
>(
  SCHEMA_DOCUMENT_LIST_REQUEST,
  async (_root: unknown, args: TDocumentListRequest, ctx) => {
    const result = await withTransaction(async (session) => {
      const documents = await listDocumentImpl(
        args.databaseName,
        args.collectionName,
        ctx.userName,
        args.query,
        args.pagination || DEFAULT_PAGINATION,
        session
      );

      return documents;
    });

    if (result == null) {
      throw new Error('Failed to list documents, transaction returned null');
    }

    return result;
  }
);

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
const createDocument = authorizeWrapper(
  SCHEMA_DOCUMENT_CREATE_REQUEST,
  async (_root: unknown, args: TDocumentCreateRequest, ctx) =>
    withCompoundTransaction((compoundSession) =>
      createDocumentImpl(
        args.databaseName,
        args.collectionName,
        ctx.userName,
        args.document,
        args.documentPermission,
        compoundSession
      )
    )
);

const updateDocument = authorizeWrapper(
  SCHEMA_DOCUMENT_UPDATE_REQUEST,
  async (_root: unknown, args: TDocumentUpdateRequest, ctx) => {
    for (let i = 0; i < args.document.length; i += 1) {
      const { error } = documentField.validate(args.document[i]);
      if (error)
        throw new Error(
          `DocumentRecord ${args.document[i].name} is not valid ${error.message}`
        );
    }

    return updateDocumentImpl(
      args.databaseName,
      args.collectionName,
      ctx.userName,
      args.query,
      args.document as any
    );
  }
);

const dropDocument = authorizeWrapper(
  SCHEMA_DOCUMENT_FIND_REQUEST,
  async (_root: unknown, args: TDocumentFindRequest, ctx) => {
    return deleteDocument(
      args.databaseName,
      args.collectionName,
      ctx.userName,
      args.query
    );
  }
);

const findDocumentHistory = authorizeWrapper(
  SCHEMA_DOCUMENT_HISTORY_FIND_REQUEST,
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
  TDocumentHistoryListResponse
>(Joi.object().optional(), async (_root: unknown, args, ctx) => {
  return withTransaction(async (session) => {
    const documents = await listDocumentHistoryImpl(
      args.databaseName,
      args.collectionName,
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
    listDocument,
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
