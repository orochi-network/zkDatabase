import Joi from 'joi';
import GraphQLJSON from 'graphql-type-json';
import { Filter } from 'mongodb';
import { withTransaction } from '@zkdb/storage';
import resolverWrapper from '../validation';
import { TCollectionRequest } from './collection';
import { DocumentRecord } from '../../model/abstract/document';
import {
  collectionName,
  databaseName,
  permissionDetail,
  permissionRecord,
} from './common';
import {
  createDocument,
  deleteDocument,
  readDocument,
  updateDocument,
} from '../../domain/use-case/document';
import { AppContext } from '../../common/types';
import { PermissionsData } from '../types/permission';

export type TDocumentFindRequest = TCollectionRequest & {
  documentQuery: { [key: string]: string };
};

export type TDocumentCreateRequest = TCollectionRequest & {
  documentRecord: DocumentRecord;
  documentPermission: PermissionsData;
};

export type TDocumentUpdateRequest = TCollectionRequest &
  Filter<DocumentRecord>;

export const DOCUMENT_FIND_REQUEST = Joi.object<TDocumentFindRequest>({
  databaseName,
  collectionName,
  documentQuery: Joi.object(),
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
  documentRecord: Joi.object(),
});

export const typeDefsDocument = `#graphql
scalar JSON
type Query
type Mutation

type MerkleWitness {
  isLeft: Boolean!
  sibling: String!
}

type Document {
  name: String!
  kind: String!
  value: String!
}

input DocumentInput {
  name: String!
  kind: String!
  value: String!
}

type DocumentOutput {
  _id: String!,
  document: [Document!]!
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
  permissionOthers: PermissionRecordInput
}

input DocumentRecordInput {
  name: String!
  kind: String!
  value: String!
}

extend type Query {
  documentFind(databaseName: String!, collectionName: String!, documentQuery: JSON!): DocumentOutput
}

extend type Mutation {
  documentCreate(
    databaseName: String!, 
    collectionName: String!, 
    documentRecord: [DocumentRecordInput!]!, 
    documentPermission: PermissionDetailInput
  ): [MerkleWitness!]!

  documentUpdate(
    databaseName: String!, 
    collectionName: String!, 
    documentQuery: JSON!,
    documentRecord: [DocumentRecordInput!]!
  ): [MerkleWitness!]!

  documentDrop(
    databaseName: String!, 
    collectionName: String!, 
    documentQuery: JSON!
  ): [MerkleWitness!]!
}
`;

// Query
const documentFind = resolverWrapper(
  DOCUMENT_FIND_REQUEST,
  async (_root: unknown, args: TDocumentFindRequest, ctx: AppContext) => {
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

    const { _id, ...pureDocument } = document;

    return {
      _id,
      document: Object.values(pureDocument),
    };
  }
);

// Mutation
const documentCreate = resolverWrapper(
  DOCUMENT_CREATE_REQUEST,
  async (_root: unknown, args: TDocumentCreateRequest, ctx: AppContext) => {
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

const documentUpdate = resolverWrapper(
  DOCUMENT_UPDATE_REQUEST,
  async (_root: unknown, args: TDocumentUpdateRequest, ctx: AppContext) => {
    const keys = Object.keys(args.documentRecord);
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      const { error } = permissionRecord.validate(args.documentRecord[key]);
      if (error)
        throw new Error(
          `PermissionRecord ${key} is not valid ${error.message}`
        );
    }

    return withTransaction((session) =>
      updateDocument(
        args.databaseName,
        args.collectionName,
        ctx.userName,
        args.documentQuery,
        args.documentRecord,
        session
      )
    );
  }
);

const documentDrop = resolverWrapper(
  DOCUMENT_FIND_REQUEST,
  async (_root: unknown, args: TDocumentFindRequest, ctx: AppContext) => {
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

export const resolversDocument = {
  JSON: GraphQLJSON,
  Query: {
    documentFind,
  },
  Mutation: {
    documentCreate,
    documentUpdate,
    documentDrop,
  },
};
