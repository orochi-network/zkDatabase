import {
  createDocument,
  deleteDocument,
  findDocumentsWithMetadata,
  readDocument,
  searchDocuments,
  updateDocument,
} from '@domain';
import { gql } from '@helper';
import { DocumentRecord } from '@model';
import { withTransaction } from '@zkdb/storage';
import GraphQLJSON from 'graphql-type-json';
import Joi from 'joi';
import { mapPagination } from '../mapper';
import { Pagination, PermissionsData, TDocumentFields } from '../types';
import { authorizeWrapper } from '../validation';
import { TCollectionRequest } from './collection';
import {
  collectionName,
  databaseName,
  documentField,
  pagination,
  permissionDetail,
} from './common';

export type TDocumentFindRequest = TCollectionRequest & {
  documentQuery: { [key: string]: string };
};

export type TDocumentsFindRequest = TCollectionRequest & {
  documentQuery: { [key: string]: string };
  pagination: Pagination;
};

export type TDocumentCreateRequest = TCollectionRequest & {
  documentRecord: DocumentRecord;
  documentPermission: PermissionsData;
};

export type TDocumentUpdateRequest = TCollectionRequest & {
  documentQuery: { [key: string]: string };
  documentRecord: TDocumentFields;
};

export const DOCUMENT_FIND_REQUEST = Joi.object<TDocumentFindRequest>({
  databaseName,
  collectionName,
  documentQuery: Joi.object(),
});

export const DOCUMENTS_FIND_REQUEST = Joi.object<TDocumentsFindRequest>({
  databaseName,
  collectionName,
  documentQuery: Joi.object(),
  pagination,
});

export const DOCUMENT_CREATE_REQUEST = Joi.object<TDocumentCreateRequest>({
  databaseName,
  collectionName,
  documentPermission: permissionDetail.required(),
  documentRecord: Joi.required(),
});

export const DOCUMENT_UPDATE_REQUEST = Joi.object<TDocumentUpdateRequest>({
  databaseName,
  collectionName,
  documentQuery: Joi.object(),
  documentRecord: Joi.required(),
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

  input PermissionRecordInput {
    system: Boolean
    create: Boolean
    read: Boolean
    write: Boolean
    delete: Boolean
  }

  input PermissionDetailInput {
    permissionOwner: PermissionRecordInput
    permissionGroup: PermissionRecordInput
    permissionOther: PermissionRecordInput
  }

  type DocumentsWithMetadataOutput {
    document: DocumentOutput!
    metadata: DocumentMetadataOutput!
    proofStatus: String
  }

  extend type Query {
    documentFind(
      databaseName: String!
      collectionName: String!
      documentQuery: JSON!
    ): DocumentOutput
    documentsFind(
      databaseName: String!
      collectionName: String!
      documentQuery: JSON!
      pagination: PaginationInput
    ): [DocumentOutput]!
    documentsWithMetadataFind(
      databaseName: String!
      collectionName: String!
      query: JSON!
      pagination: PaginationInput
    ): [DocumentsWithMetadataOutput]!
  }

  extend type Mutation {
    documentCreate(
      databaseName: String!
      collectionName: String!
      documentRecord: [DocumentRecordInput!]!
      documentPermission: PermissionDetailInput
    ): [MerkleWitness!]!

    documentUpdate(
      databaseName: String!
      collectionName: String!
      documentQuery: JSON!
      documentRecord: [DocumentRecordInput!]!
    ): [MerkleWitness!]!

    documentDrop(
      databaseName: String!
      collectionName: String!
      documentQuery: JSON!
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
        args.documentQuery,
        session
      )
    );

    if (!document) {
      return null;
    }

    return {
      docId: document.docId,
      fields: document.fields,
      createdAt: document.createdAt,
    };
  }
);

const documentsFind = authorizeWrapper(
  DOCUMENTS_FIND_REQUEST,
  async (_root: unknown, args: TDocumentsFindRequest, ctx) => {
    return withTransaction(async (session) => {
      const documents = await searchDocuments(
        args.databaseName,
        args.collectionName,
        ctx.userName,
        args.documentQuery,
        mapPagination(args.pagination),
        session
      );

      return documents;
    });
  }
);

const documentsWithMetadataFind = authorizeWrapper(
  Joi.object().optional(),
  async (_root: unknown, args: TDocumentsFindRequest, ctx) => {
    return withTransaction(async (session) => {
      const documents = await findDocumentsWithMetadata(
        args.databaseName,
        args.collectionName,
        ctx.userName,
        args.documentQuery,
        mapPagination(args.pagination),
        session
      );

      return documents;
    });
  }
);

// Mutation
const documentCreate = authorizeWrapper(
  DOCUMENT_CREATE_REQUEST,
  async (_root: unknown, args: TDocumentCreateRequest, ctx) => {
    return withTransaction((session) =>
      createDocument(
        args.databaseName,
        args.collectionName,
        ctx.userName,
        args.documentRecord as any,
        args.documentPermission,
        session
      )
    );
  }
);

const documentUpdate = authorizeWrapper(
  DOCUMENT_UPDATE_REQUEST,
  async (_root: unknown, args: TDocumentUpdateRequest, ctx) => {
    for (let i = 0; i < args.documentRecord.length; i += 1) {
      const { error } = documentField.validate(args.documentRecord[i]);
      if (error)
        throw new Error(
          `DocumentRecord ${args.documentRecord[i].name} is not valid ${error.message}`
        );
    }

    return withTransaction((session) =>
      updateDocument(
        args.databaseName,
        args.collectionName,
        ctx.userName,
        args.documentQuery,
        args.documentRecord as any,
        session
      )
    );
  }
);

const documentDrop = authorizeWrapper(
  DOCUMENT_FIND_REQUEST,
  async (_root: unknown, args: TDocumentFindRequest, ctx) => {
    return withTransaction((session) =>
      deleteDocument(
        args.databaseName,
        args.collectionName,
        ctx.userName,
        args.documentQuery,
        session
      )
    );
  }
);

type TDocumentResolver = {
  JSON: typeof GraphQLJSON;
  Query: {
    documentFind: typeof documentFind;
    documentsFind: typeof documentsFind;
    documentsWithMetadataFind: typeof documentsWithMetadataFind;
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
  },
  Mutation: {
    documentCreate,
    documentUpdate,
    documentDrop,
  },
};
