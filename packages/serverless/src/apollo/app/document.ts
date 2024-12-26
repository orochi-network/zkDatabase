// TODO: parseQuery already validates the query to some extent, but still,
// consider validating the query object before passing to parseQuery

import { withCompoundTransaction, withTransaction } from '@zkdb/storage';
import GraphQLJSON from 'graphql-type-json';
import Joi from 'joi';
import { Document, Metadata } from '@domain';
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
  TDocumentHistoryRequest,
  TDocumentHistoryResponse,
  TDocumentUpdateResponse,
  TDocumentFindResponse,
  PERMISSION_DEFAULT,
  TDocumentCreateResponse,
  TDocumentDropRequest,
  TDocumentDropResponse,
  docId,
  TDocumentMetadataRequest,
  TDocumentMetadataResponse,
} from '@zkdb/common';

import { Permission } from '@zkdb/permission';
import { GraphqlHelper } from '@helper';
import { DEFAULT_PAGINATION } from '@common';

const JOI_DOCUMENT_LIST_REQUEST = Joi.object<TDocumentFindRequest>({
  databaseName,
  collectionName,
  query: Joi.object(),
  pagination,
});

const JOI_DOCUMENT_CREATE_REQUEST = Joi.object<TDocumentCreateRequest>({
  databaseName,
  collectionName,
  documentPermission: Joi.number().min(0).max(0xffffff).optional(),

  // TODO: need testing
  document: schemaDocumentRecord,
});

const JOI_DOCUMENT_UPDATE_REQUEST = Joi.object<TDocumentUpdateRequest>({
  databaseName,
  collectionName,
  docId: docId(true),

  // TODO: need testing
  document: schemaDocumentRecord,
});

const JOI_DOCUMENT_HISTORY_FIND_REQUEST = Joi.object<TDocumentHistoryRequest>({
  databaseName,
  collectionName,
  docId: docId(true),
  pagination,
});

export const typeDefsDocument = gql`
  #graphql
  scalar JSON
  type Query
  type Mutation

  enum ProofStatusDocument {
    Queued
    Proving
    Proved
    Failed
  }

  type MerkleProof {
    isLeft: Boolean!
    sibling: String!
  }

  type DocumentRevisionResponse {
    document: JSON!
    createdAt: Date!
    updatedAt: Date!
  }

  type DocumentResponse {
    docId: String!
    document: JSON!
    createdAt: Date!
    updatedAt: Date!
    metadata: DocumentMetadataResponse
    proofStatus: ProofStatusDocument
  }

  type DocumentFindResponse {
    data: [DocumentResponse!]!
    total: Int!
    offset: Int!
  }

  type DocumentCreateResponse {
    merkleProof: [MerkleProof!]!
    docId: String!
    acknowledged: Boolean!
  }

  # History aka revisions of a document
  type DocumentHistoryFindResponse {
    data: [DocumentRevisionResponse!]!
    total: Int!
    offset: Int!
  }

  type DocumentMetadataResponse {
    owner: String!
    group: String!
    permission: Int!
    collectionName: String!
    docId: String!
    merkleIndex: String!
  }

  extend type Query {
    documentFind(
      databaseName: String!
      collectionName: String!
      query: JSON # If not provided, return all documents
      pagination: PaginationInput
    ): DocumentFindResponse

    documentMetadata(
      databaseName: String!
      collectionName: String!
      docId: String!
    ): DocumentMetadataResponse

    documentHistoryFind(
      databaseName: String!
      collectionName: String!
      docId: String!
      pagination: PaginationInput
    ): DocumentHistoryFindResponse
  }

  extend type Mutation {
    documentCreate(
      databaseName: String!
      collectionName: String!
      document: JSON!
      documentPermission: Int
    ): DocumentCreateResponse!

    documentUpdate(
      databaseName: String!
      collectionName: String!
      docId: String!
      document: JSON!
    ): [MerkleProof!]!

    documentDrop(
      databaseName: String!
      collectionName: String!
      docId: String!
    ): [MerkleProof!]!
  }
`;

const documentFind = authorizeWrapper<
  TDocumentFindRequest,
  TDocumentFindResponse
>(JOI_DOCUMENT_LIST_REQUEST, async (_root: unknown, args, ctx, info) => {
  const includesMetadata = GraphqlHelper.checkRequestedFieldExist(info, [
    'data',
    'metadata',
  ]);
  const includesProofStatus = GraphqlHelper.checkRequestedFieldExist(info, [
    'data',
    'proofStatus',
  ]);

  return withTransaction(async (session) => {
    let [listDocument, numTotalDocument] = await Document.query(
      {
        databaseName: args.databaseName,
        collectionName: args.collectionName,
        actor: ctx.userName,
      },
      args.query || {},
      args.pagination || DEFAULT_PAGINATION,
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

    return {
      data: listDocument,
      total: numTotalDocument,
      offset: args.pagination?.offset || DEFAULT_PAGINATION.offset,
    };
  });
});

// Mutation
const documentCreate = authorizeWrapper<
  TDocumentCreateRequest,
  TDocumentCreateResponse
>(JOI_DOCUMENT_CREATE_REQUEST, async (_root: unknown, args, ctx) =>
  withCompoundTransaction(async (compoundSession) =>
    Document.create(
      {
        databaseName: args.databaseName,
        collectionName: args.collectionName,
        actor: ctx.userName,
      },
      args.document,
      args.documentPermission
        ? Permission.from(args.documentPermission)
        : PERMISSION_DEFAULT,
      compoundSession
    )
  )
);

const documentUpdate = authorizeWrapper<
  TDocumentUpdateRequest,
  TDocumentUpdateResponse
>(JOI_DOCUMENT_UPDATE_REQUEST, async (_root: unknown, args, ctx) => {
  return withCompoundTransaction(async (session) =>
    Document.update(
      {
        databaseName: args.databaseName,
        collectionName: args.collectionName,
        actor: ctx.userName,
      },
      args.docId,
      args.document,
      session
    )
  );
});

const documentDrop = authorizeWrapper<
  TDocumentDropRequest,
  TDocumentDropResponse
>(JOI_DOCUMENT_UPDATE_REQUEST, async (_root: unknown, args, ctx) => {
  return withCompoundTransaction(async (session) => {
    return Document.drop(
      {
        databaseName: args.databaseName,
        collectionName: args.collectionName,
        actor: ctx.userName,
      },
      args.docId,
      session
    );
  });
});

const documentHistoryFind = authorizeWrapper<
  TDocumentHistoryRequest,
  TDocumentHistoryResponse
>(
  JOI_DOCUMENT_HISTORY_FIND_REQUEST,
  async (
    _root: unknown,
    { databaseName, collectionName, docId, pagination },
    ctx
  ) => {
    return withTransaction(async (session) => {
      const [listRevision, totalRevision] = await Document.history(
        {
          databaseName,
          collectionName,
          docId,
          actor: ctx.userName,
        },
        pagination || DEFAULT_PAGINATION,
        session
      );

      return {
        data: listRevision,
        total: totalRevision,
        offset: pagination?.offset || DEFAULT_PAGINATION.offset,
      };
    });
  }
);

const documentMetadata = authorizeWrapper<
  TDocumentMetadataRequest,
  TDocumentMetadataResponse
>(
  Joi.object({
    databaseName,
    collectionName,
    docId,
  }),
  async (_root, { databaseName, collectionName, docId }, ctx) => {
    const documentMetadata = await Metadata.document({
      databaseName,
      collectionName,
      docId,
      actor: ctx.userName,
    });

    if (!documentMetadata) {
      throw new Error(`Can't find metadata document: ${docId}`);
    }

    return documentMetadata;
  }
);

export const resolversDocument = {
  JSON: GraphQLJSON,
  Query: {
    documentFind,
    documentHistoryFind,
    documentMetadata,
  },
  Mutation: {
    documentCreate,
    documentUpdate,
    documentDrop,
  },
};
