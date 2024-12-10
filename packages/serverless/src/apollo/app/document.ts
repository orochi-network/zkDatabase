import { withCompoundTransaction, withTransaction } from '@zkdb/storage';
import GraphQLJSON from 'graphql-type-json';
import Joi from 'joi';
import {
  createDocument,
  deleteDocument,
  findDocumentsWithMetadata,
  readDocument,
  searchDocuments,
  updateDocument,
} from '../../domain/use-case/document.js';
import {
  listHistoryDocuments,
  readHistoryDocument,
} from '../../domain/use-case/document-history.js';
import { gql } from '../../helper/common.js';
import { authorizeWrapper } from '../validation.js';
import {
  TDocumentField,
  collectionName,
  databaseName,
  documentField,
  pagination,
  TDocumentCreateRequest,
  TDocumentListFindRequest,
  TDocumentFindRequest,
  TDocumentUpdateRequest,
  TDocumentHistoryGetRequest,
  TDocumentHistoryListRequest,
} from '@zkdb/common';

import { DEFAULT_PAGINATION } from '../../common/const.js';

export const DOCUMENT_FIND_REQUEST = Joi.object<TDocumentFindRequest>({
  databaseName,
  collectionName,
  query: Joi.object(),
});

export const DOCUMENTS_FIND_REQUEST = Joi.object<TDocumentListFindRequest>({
  databaseName,
  collectionName,
  query: Joi.object(),
  pagination,
});

export const DOCUMENT_CREATE_REQUEST = Joi.object<TDocumentCreateRequest>({
  databaseName,
  collectionName,
  documentPermission: Joi.number().min(0).max(0xffffff).required(),
  // TODO: CRITICAL: validate this since user could pass an arbitrary object
  // and it will be stored in the database
  document: Joi.required(),
});

export const DOCUMENT_UPDATE_REQUEST = Joi.object<TDocumentUpdateRequest>({
  databaseName,
  collectionName,
  query: Joi.object(),
  // TODO: CRITICAL: validate this since user could pass an arbitrary object
  // and it will be stored in the database
  document: Joi.required(),
});

export const DOCUMENT_HISTORY_GET_REQUEST =
  Joi.object<TDocumentHistoryGetRequest>({
    databaseName,
    collectionName,
    docId: Joi.string(),
  });

export const DOCUMENT_HISTORY_LIST_REQUEST =
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

  type MerkleWitness {
    isLeft: Boolean!
    sibling: String!
  }

  type DocumentsWithMetadataOutput {
    document: DocumentOutput!
    metadata: DocumentMetadataOutput!
    proofStatus: String
  }

  type DocumentPaginationOutput {
    data: [DocumentOutput]!
    totalSize: Int!
    offset: Int!
  }

  type DocumentHistoryOutput {
    docId: String!
    documents: [DocumentOutput!]!
  }

  type DocumentOutput {
    docId: String!
    fields: [DocumentRecordOutput!]!
    createdAt: Date
  }

  type DocumentRecordOutput {
    name: String!
    kind: String!
    value: String!
  }

  extend type Query {
    documentFind(
      databaseName: String!
      collectionName: String!
      query: JSON!
    ): DocumentOutput

    documentsFind(
      databaseName: String!
      collectionName: String!
      query: JSON!
      pagination: PaginationInput
    ): DocumentPaginationOutput!

    documentsWithMetadataFind(
      databaseName: String!
      collectionName: String!
      query: JSON!
      pagination: PaginationInput
    ): [DocumentsWithMetadataOutput]!

    documentsHistoryList(
      databaseName: String!
      collectionName: String!
      docId: String
      pagination: PaginationInput
    ): [DocumentHistoryOutput]!
  }

  extend type Mutation {
    documentCreate(
      databaseName: String!
      collectionName: String!
      document: [SchemaFieldInput!]!
      documentPermission: Int
    ): [MerkleWitness!]!

    documentUpdate(
      databaseName: String!
      collectionName: String!
      query: JSON!
      document: [SchemaFieldInput!]!
    ): [MerkleWitness!]!

    documentDrop(
      databaseName: String!
      collectionName: String!
      query: JSON!
    ): [MerkleWitness!]!
  }
`;

// Query
const documentFind = authorizeWrapper(
  DOCUMENT_FIND_REQUEST,
  async (_root: unknown, args: TDocumentFindRequest, ctx) => {
    const document = await withTransaction((session) =>
      readDocument(
        args.databaseName,
        args.collectionName,
        ctx.userName,
        args.query,
        session
      )
    );

    if (!document) {
      return null;
    }

    return {
      docId: document.docId,
      document: document.document,
      createdAt: document.createdAt,
    };
  }
);

const documentsFind = authorizeWrapper(
  DOCUMENTS_FIND_REQUEST,
  async (_root: unknown, args: TDocumentListFindRequest, ctx) => {
    return withTransaction(async (session) => {
      const documents = await searchDocuments(
        args.databaseName,
        args.collectionName,
        ctx.userName,
        args.query,
        args.pagination || DEFAULT_PAGINATION,
        session
      );

      return documents;
    });
  }
);

const documentsWithMetadataFind = authorizeWrapper(
  Joi.object().optional(),
  async (_root: unknown, args: TDocumentListFindRequest, ctx) => {
    return withTransaction(async (session) => {
      const documents = await findDocumentsWithMetadata(
        args.databaseName,
        args.collectionName,
        ctx.userName,
        args.query,
        args.pagination || DEFAULT_PAGINATION,
        session
      );

      return documents;
    });
  }
);

// Mutation
const documentCreate = authorizeWrapper(
  DOCUMENT_CREATE_REQUEST,
  async (_root: unknown, args: TDocumentCreateRequest, ctx) =>
    withCompoundTransaction((compoundSession) =>
      createDocument(
        args.databaseName,
        args.collectionName,
        ctx.userName,
        args.document,
        args.documentPermission,
        compoundSession
      )
    )
);

const documentUpdate = authorizeWrapper(
  DOCUMENT_UPDATE_REQUEST,
  async (_root: unknown, args: TDocumentUpdateRequest, ctx) => {
    for (let i = 0; i < args.document.length; i += 1) {
      const { error } = documentField.validate(args.document[i]);
      if (error)
        throw new Error(
          `DocumentRecord ${args.document[i].name} is not valid ${error.message}`
        );
    }

    return updateDocument(
      args.databaseName,
      args.collectionName,
      ctx.userName,
      args.query,
      args.document as any
    );
  }
);

const documentDrop = authorizeWrapper(
  DOCUMENT_FIND_REQUEST,
  async (_root: unknown, args: TDocumentFindRequest, ctx) => {
    return deleteDocument(
      args.databaseName,
      args.collectionName,
      ctx.userName,
      args.query
    );
  }
);

const historyDocumentGet = authorizeWrapper(
  DOCUMENT_HISTORY_GET_REQUEST,
  async (_root: unknown, args: TDocumentHistoryGetRequest, ctx) => {
    return withTransaction((session) =>
      readHistoryDocument(
        args.databaseName,
        args.collectionName,
        ctx.userName,
        args.docId,
        session
      )
    );
  }
);

const documentsHistoryList = authorizeWrapper(
  Joi.object().optional(),
  async (_root: unknown, args: TDocumentHistoryListRequest, ctx) => {
    return withTransaction(async (session) => {
      const documents = await listHistoryDocuments(
        args.databaseName,
        args.collectionName,
        ctx.userName,
        args.pagination || DEFAULT_PAGINATION,
        session
      );

      return documents;
    });
  }
);

type TDocumentResolver = {
  JSON: typeof GraphQLJSON;
  Query: {
    documentFind: typeof documentFind;
    documentsFind: typeof documentsFind;
    documentsWithMetadataFind: typeof documentsWithMetadataFind;
    historyDocumentGet: typeof historyDocumentGet;
    documentsHistoryList: typeof documentsHistoryList;
  };
  Mutation: {
    documentCreate: typeof documentCreate;
    documentUpdate: typeof documentUpdate;
    documentDrop: typeof documentDrop;
  };
};

export const resolversDocument: TDocumentResolver = {
  JSON: GraphQLJSON,
  Query: {
    documentFind,
    documentsFind,
    documentsWithMetadataFind,
    historyDocumentGet,
    documentsHistoryList,
  },
  Mutation: {
    documentCreate,
    documentUpdate,
    documentDrop,
  },
};
