// TODO: consider validating the query object before passing to parseQuery

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
  TDocumentFindRequest,
  TDocumentUpdateRequest,
  TDocumentHistoryFindRequest,
  TDocumentHistoryListRequest,
  TDocumentHistoryListResponse,
  TDocumentModificationResponse,
  TDocumentHistoryResponse,
  TPaginationReturn,
  TDocumentFindResponse,
} from '@zkdb/common';

import { DEFAULT_PAGINATION } from '@common';
import { Permission } from '@zkdb/permission';
import { GraphqlHelper } from 'src/helper/graphql';

export const JOI_DOCUMENT_FIND_REQUEST = Joi.object<TDocumentFindRequest>({
  databaseName,
  collectionName,
  query: Joi.object(),
});

export const JOI_DOCUMENT_LIST_REQUEST = Joi.object<TDocumentFindRequest>({
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

  type DocumentResponse {
    docId: String!
    document: JSON
    createdAt: Date
    updatedAt: Date
    metadata: MetadataDocumentResponse
    proofStatus: String
  }

  type DocumentFindResponse {
    data: [DocumentResponse!]!
    total: Int
    offset: Int
  }

  # History aka revisions of a document
  type DocumentHistoryFindResponse {
    docId: String!
    documentRevision: [DocumentResponse!]!
    metadata: MetadataDocumentResponse!
    active: Boolean!
    total: Int
    offset: Int
  }

  extend type Query {
    documentFind(
      databaseName: String!
      collectionName: String!
      query: JSON!
      pagination: PaginationInput
    ): DocumentFindResponse

    documentHistoryFind(
      databaseName: String!
      collectionName: String!
      docId: String!
      pagination: PaginationInput
    ): [DocumentHistoryFindResponse]!
  }

  extend type Mutation {
    documentCreate(
      databaseName: String!
      collectionName: String!
      document: JSON
      documentPermission: Int
    ): [MerkleProof!]!

    documentUpdate(
      databaseName: String!
      collectionName: String!
      query: JSON!
      document: [SchemaFieldInput!]!
    ): [MerkleProof!]!

    documentDrop(
      databaseName: String!
      collectionName: String!
      query: JSON!
    ): [MerkleProof!]!
  }
`;

const documentFind = authorizeWrapper<
  TDocumentFindRequest,
  TPaginationReturn<TDocumentFindResponse[]>
>(JOI_DOCUMENT_LIST_REQUEST, async (_root: unknown, args, ctx, info) => {
  const includesMetadata = GraphqlHelper.checkRequestedFieldExist(info, [
    'data',
    'metadata',
  ]);
  const includesProofStatus = GraphqlHelper.checkRequestedFieldExist(info, [
    'data',
    'proofStatus',
  ]);

  return await withTransaction(async (session) => {
    let listDocument = await Document.query(
      {
        databaseName: args.databaseName,
        collectionName: args.collectionName,
        actor: ctx.userName,
      },
      args.query,
      args.pagination,
      session
    );

    // Lazily fill metadata and proof status if requested
    // TODO: can we fill metadata and proof status in parallel?
    if (includesMetadata) {
      listDocument = await Document.fillMetadata(
        listDocument,
        args.databaseName
      );
    }

    if (includesProofStatus) {
      listDocument = await Document.fillProofStatus(
        listDocument,
        args.collectionName
      );
    }

    // TODO: properly paginate
    return {
      data: listDocument,
      total: listDocument.length,
      offset: 0,
    };
  });
});

// Mutation
const documentCreate = authorizeWrapper<
  TDocumentCreateRequest,
  TDocumentModificationResponse
>(
  JOI_DOCUMENT_CREATE_REQUEST,
  async (_root: unknown, args: TDocumentCreateRequest, ctx) =>
    withCompoundTransaction((compoundSession) =>
      Document.create(
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

const documentUpdate = authorizeWrapper<
  TDocumentUpdateRequest,
  TDocumentModificationResponse
>(JOI_DOCUMENT_UPDATE_REQUEST, async (_root: unknown, args, ctx) => {
  return withTransaction((session) =>
    Document.update(
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

const documentDrop = authorizeWrapper<
  TDocumentFindRequest,
  TDocumentModificationResponse
>(
  JOI_DOCUMENT_FIND_REQUEST,
  async (_root: unknown, args: TDocumentFindRequest, ctx) => {
    return Document.drop(
      {
        databaseName: args.databaseName,
        collectionName: args.collectionName,
        actor: ctx.userName,
      },
      args.query
    );
  }
);

const documentHistoryFind = authorizeWrapper<
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
    documentFind,
    documentHistoryFind,
  },
  Mutation: {
    documentCreate,
    documentUpdate,
    documentDrop,
  },
};
