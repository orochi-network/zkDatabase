// TODO: parseQuery already validates the query to some extent, but still,
// consider validating the query object before passing to parseQuery

import { Document, Metadata } from '@domain';
import { gql } from '@helper';
import {
  collectionName,
  databaseName,
  docId,
  pagination,
  PERMISSION_DEFAULT,
  TDocumentCreateRequest,
  TDocumentCreateResponse,
  TDocumentDropRequest,
  TDocumentDropResponse,
  TDocumentFindRequest,
  TDocumentFindResponse,
  TDocumentHistoryFindRequest,
  TDocumentHistoryFindResponse,
  TDocumentMetadataRequest,
  TDocumentMetadataResponse,
  TDocumentUpdateRequest,
  TDocumentUpdateResponse,
  TMerkleProofDocumentRequest,
  TMerkleProofDocumentResponse,
} from '@zkdb/common';
import { Transaction } from '@zkdb/storage';
import Joi from 'joi';

import { DEFAULT_PAGINATION } from '@common';
import { Permission } from '@zkdb/permission';
import { authorizeWrapper } from '../validation';

// The value will be validated against the schema type in the database later
const JOI_DOCUMENT_CREATE = (required?: boolean) =>
  required !== false
    ? Joi.object().pattern(Joi.string(), Joi.any()).required()
    : Joi.object().pattern(Joi.string(), Joi.any()).optional();

const JOI_DOCUMENT_LIST_REQUEST = Joi.object<TDocumentFindRequest>({
  databaseName,
  collectionName: collectionName(),
  query: Joi.object(),
  pagination,
});

const JOI_DOCUMENT_CREATE_REQUEST = Joi.object<TDocumentCreateRequest>({
  databaseName,
  collectionName: collectionName(),
  documentPermission: Joi.number().min(0).max(0xffffff).optional(),

  // TODO: need testing
  document: JOI_DOCUMENT_CREATE(true),
});

const JOI_DOCUMENT_UPDATE_REQUEST = Joi.object<TDocumentUpdateRequest>({
  databaseName,
  collectionName: collectionName(),
  docId: docId(),

  // TODO: need testing
  document: JOI_DOCUMENT_CREATE(true),
});

const JOI_DOCUMENT_DROP_REQUEST = Joi.object<TDocumentDropRequest>({
  databaseName,
  collectionName: collectionName(),
  docId: docId(),
});

const JOI_DOCUMENT_HISTORY_FIND_REQUEST =
  Joi.object<TDocumentHistoryFindRequest>({
    databaseName,
    collectionName: collectionName(),
    docId: docId(),
    pagination,
  });

export const typeDefsDocument = gql`
  #graphql
  type Query
  type Mutation

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
  }

  type DocumentFindResponse {
    data: [DocumentResponse!]!
    total: Int!
    offset: Int!
  }

  type DocumentCreateResponse {
    docId: String!
    acknowledged: Boolean!
    document: JSON!
  }

  type DocumentDropResponse {
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
    merkleIndex: BigInt!
    operationNumber: Int!
  }

  extend type Query {
    documentFind(
      databaseName: String!
      collectionName: String!
      query: JSON # If not provided, return all documents
      pagination: PaginationInput
    ): DocumentFindResponse!

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
    ): DocumentHistoryFindResponse!

    documentMerkleProofStatus(
      databaseName: String!
      collectionName: String!
      docId: String!
    ): QueueTaskStatus!
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
    ): JSON!

    documentDrop(
      databaseName: String!
      collectionName: String!
      docId: String!
    ): DocumentDropResponse!
  }
`;

const documentFind = authorizeWrapper<
  TDocumentFindRequest,
  TDocumentFindResponse
>(JOI_DOCUMENT_LIST_REQUEST, async (_root: unknown, args, ctx) => {
  return Transaction.serverless(async (session) => {
    const [listDocument, numTotalDocument]: [
      TDocumentFindResponse['data'],
      number,
    ] = await Document.query(
      {
        databaseName: args.databaseName,
        collectionName: args.collectionName,
        actor: ctx.userName,
      },
      args.query || {},
      args.pagination || DEFAULT_PAGINATION,
      session
    );

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
  Transaction.compound(async (compoundSession) =>
    Document.create(
      {
        databaseName: args.databaseName,
        collectionName: args.collectionName,
        actor: ctx.userName,
      },
      args.document,
      compoundSession,
      args.documentPermission
        ? Permission.from(args.documentPermission)
        : PERMISSION_DEFAULT
    )
  )
);

const documentUpdate = authorizeWrapper<
  TDocumentUpdateRequest,
  TDocumentUpdateResponse
>(JOI_DOCUMENT_UPDATE_REQUEST, async (_root: unknown, args, ctx) => {
  return Transaction.compound(async (session) =>
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
>(JOI_DOCUMENT_DROP_REQUEST, async (_root: unknown, args, ctx) => {
  return Transaction.compound(async (session) => {
    const droppedDocId = await Document.drop(
      {
        databaseName: args.databaseName,
        collectionName: args.collectionName,
        actor: ctx.userName,
      },
      args.docId,
      session
    );

    return {
      docId: droppedDocId,
      acknowledged: true,
    };
  });
});

const documentHistoryFind = authorizeWrapper<
  TDocumentHistoryFindRequest,
  TDocumentHistoryFindResponse
>(
  JOI_DOCUMENT_HISTORY_FIND_REQUEST,
  async (
    _root: unknown,
    { databaseName, collectionName, docId, pagination },
    ctx
  ) => {
    return Transaction.serverless(async (session) => {
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

const documentMerkleProofStatus = authorizeWrapper<
  TMerkleProofDocumentRequest,
  TMerkleProofDocumentResponse
>(
  Joi.object({
    databaseName,
    collectionName,
    docId,
  }),
  async (_root, args, ctx) => {
    return Transaction.compound(async (session) =>
      Document.merkleProofStatus(
        {
          ...args,
          actor: ctx.userName,
        },
        session
      )
    );
  }
);

export const resolversDocument = {
  Query: {
    documentFind,
    documentHistoryFind,
    documentMetadata,
    documentMerkleProofStatus,
  },
  Mutation: {
    documentCreate,
    documentUpdate,
    documentDrop,
  },
};
