import Joi from 'joi';
import GraphQLJSON from 'graphql-type-json';
import { Filter } from 'mongodb';
import resolverWrapper from '../validation';
import { TCollectionRequest } from './collection';
import {
  DocumentPermission,
  DocumentRecord,
  ModelDocument,
} from '../../model/abstract/document';
import {
  collectionName,
  databaseName,
  permissionDetail,
  permissionRecord,
} from './common';

export type TDocumentFindRequest = TCollectionRequest & {
  documentQuery: { [key: string]: string };
};

export type TDocumentCreateRequest = TCollectionRequest & {
  documentRecord: DocumentRecord;
  documentPermission: DocumentPermission;
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

type PermissionRecord {
  system: Boolean
  create: Boolean
  read: Boolean
  write: Boolean
  delete: Boolean
}

input PermissionDetail {
  permissionOwner: PermissionRecord
  permissionGroup: PermissionRecord
  permissionOthers: PermissionRecord
}

input DocumentRecord {
  name: String!
  kind: String!
  value: String!
}

extend type Query {
  documentFind(databaseName: String!, collectionName: String!, documentQuery: JSON!): JSON
}

extend type Mutation {
  documentCreate(databaseName: String!, collectionName: String!, documentRecord: [DocumentRecord!]!, documentPermission: PermissionDetail): JSON
  documentUpdate(databaseName: String!, collectionName: String!, documentQuery: JSON!, documentRecord: JSON!): Boolean
  documentDrop(databaseName: String!, collectionName: String!, documentQuery: JSON!): JSON
}
`;

// Query
const documentFind = resolverWrapper(
  DOCUMENT_FIND_REQUEST,
  async (_root: unknown, args: TDocumentFindRequest) => {
    return (
      await ModelDocument.getInstance(args.databaseName, args.collectionName)
    ).find(args.documentQuery);
  }
);

// Mutation
const documentCreate = resolverWrapper(
  DOCUMENT_CREATE_REQUEST,
  async (_root: unknown, args: TDocumentCreateRequest) => {
    return (
      await ModelDocument.getInstance(args.databaseName, args.collectionName)
    ).insertOne(args.documentRecord, args.documentPermission);
  }
);

const documentUpdate = resolverWrapper(
  DOCUMENT_UPDATE_REQUEST,
  async (_root: unknown, args: TDocumentUpdateRequest) => {
    const keys = Object.keys(args.documentRecord);
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      const { error } = permissionRecord.validate(args.documentRecord[key]);
      if (error)
        throw new Error(
          `PermissionRecord ${key} is not valid ${error.message}`
        );
    }
    return (
      await ModelDocument.getInstance(args.databaseName, args.collectionName)
    ).updateOne(args.documentQuery, args.documentRecord);
  }
);

const documentDrop = resolverWrapper(
  DOCUMENT_FIND_REQUEST,
  async (_root: unknown, args: TDocumentFindRequest) => {
    return (
      await ModelDocument.getInstance(args.databaseName, args.collectionName)
    ).drop(args.documentQuery);
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
