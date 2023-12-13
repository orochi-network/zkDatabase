import Joi from 'joi';
import GraphQLJSON from 'graphql-type-json';
import resolverWrapper from '../validation';
import { AppContext } from '../../helper/common';
import { ModelCollection } from '../../model/collection';
import { TCollectionRequest } from './collection';
import { ModelDocument } from '../../model/document';
import { collectionName, databaseName } from './common';

export type TDocumentFindRequest = TCollectionRequest & {
  documentQuery: { [key: string]: string };
};

export type TDocumentCreateRequest = TCollectionRequest & {
  documentRecord: { [key: string]: any };
};

export type TDocumentUpdateRequest = TDocumentFindRequest & {
  documentRecord: { [key: string]: any };
};

export const DocumentFindRequest = Joi.object<TDocumentFindRequest>({
  databaseName,
  collectionName,
  documentQuery: Joi.object(),
});

export const DocumentCreateRequest = Joi.object<TDocumentCreateRequest>({
  databaseName,
  collectionName,
  documentRecord: Joi.object().required(),
});

export const DocumentUpdateRequest = Joi.object<TDocumentUpdateRequest>({
  databaseName,
  collectionName,
  documentQuery: Joi.object(),
  documentRecord: Joi.object(),
});


export const typeDefsDocument = `#graphql
scalar JSON
type Query
type Mutation

extend type Query {
  documentFind(databaseName: String!, collectionName: String!, documentQuery: JSON!): JSON
}

extend type Mutation {
  documentCreate(databaseName: String!, collectionName: String!, documentRecord: JSON!): JSON
  documentUpdate(databaseName: String!, collectionName: String!, documentQuery: JSON!, documentRecord: JSON!): Boolean
  documentDrop(databaseName: String!, collectionName: String!, documentQuery: JSON!): JSON
}
`;

// Query
const documentFind = resolverWrapper(
  DocumentFindRequest,
  async (_root: unknown, args: TDocumentFindRequest, _context: AppContext) => {
    return ModelDocument.getInstance(args.databaseName, args.collectionName).find(args.documentQuery);
  }
);

// Mutation
const documentCreate = resolverWrapper(
  DocumentCreateRequest,
  async (_root: unknown, args: TDocumentCreateRequest, _context: AppContext) => {
    return ModelDocument.getInstance(
      args.databaseName,
      args.collectionName
    ).insertOne(args.documentRecord);
  }
);

const documentUpdate = resolverWrapper(
  DocumentUpdateRequest,
  async (_root: unknown, args: TDocumentUpdateRequest, _context: AppContext) => {
    return ModelDocument.getInstance(
      args.databaseName,
      args.collectionName
    ).updateOne(args.documentQuery, args.documentRecord);
  }
);

const documentDrop = resolverWrapper(
  DocumentFindRequest,
  async (_root: unknown, args: TDocumentFindRequest, _context: AppContext) => {
    return ModelDocument.getInstance(
      args.databaseName,
      args.collectionName
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
