import Joi from 'joi';
import GraphQLJSON from 'graphql-type-json';
import resolverWrapper from '../validation';
import { AppContext } from '../../helper/common';
import { ModelCollection } from '../../model/collection';
import { CollectionRequest, TCollectionRequest } from './collection';
import { ModelDocument } from '../../model/document';

export type TDocumentFindRequest = TCollectionRequest;

export const typeDefsDatabase = `#graphql
scalar JSON
type Query
type Mutation

extend type Query {
  documentFind(databaseName: String!, collectionName: String!, documentQuery: JSON): JSON
}

extend type Mutation {
  documentCreate(databaseName: String!, collectionName: String!, documentRecord: JSON): JSON
  documentUpdate(databaseName: String!, collectionName: String!, documentQuery: JSON, documentRecord: JSON): JSON
}
`;

// Query
const documentFind = resolverWrapper(
  CollectionRequest,
  async (_root: unknown, args: TCollectionRequest, _context: AppContext) => {
    return ModelDocument.getInstance(args.databaseName, args.collectionName).find();
  }
);

// Mutation
const documentCreate = resolverWrapper(
  CollectionRequest,
  async (_root: unknown, args: TCollectionRequest, _context: AppContext) => {
    return ModelCollection.getInstance(
      args.databaseName,
      args.collectionName
    ).create({});
  }
);

const documentUpdate = resolverWrapper(
  CollectionRequest,
  async (_root: unknown, args: TCollectionRequest, _context: AppContext) => {
    return ModelCollection.getInstance(
      args.databaseName,
      args.collectionName
    ).create({});
  }
);

const documentDrop = resolverWrapper(
  CollectionRequest,
  async (_root: unknown, args: TCollectionRequest, _context: AppContext) => {
    return ModelCollection.getInstance(
      args.databaseName,
      args.collectionName
    ).create({});
  }
);

export const resolversDatabase = {
  JSON: GraphQLJSON,
  Query: {
    documentFind,
  },
  Mutation: {},
};
