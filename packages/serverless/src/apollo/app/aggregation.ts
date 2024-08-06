import Joi from 'joi';
import GraphQLJSON from 'graphql-type-json';
import resolverWrapper from '../validation.js';
import { collectionName, databaseName } from './common.js';
import { readManyDocuments } from '../../domain/use-case/document.js';
import { TCollectionRequest } from './collection.js';
import { AppContext } from '../../common/types.js';

export const typeDefsAggregation = `#graphql
scalar JSON
type Query

type Document {
  name: String!
  kind: String!
  value: String!
}

type PermissionRecord {
  read: Boolean
  write: Boolean
  delete: Boolean
  create: Boolean
  system: Boolean
}

type Metadata {
  merkleIndex: Int!,
  userName: String
  groupName: String
  permissionOwner: PermissionRecord
  permissionGroup: PermissionRecord
  permissionOther: PermissionRecord
}

type DocumentOutput {
  _id: String!,
  document: [Document!]!
  metadata: Metadata!,
  proofStatus: String
}


extend type Query {
  documentFindMany(databaseName: String!, collectionName: String!): [DocumentOutput]
}
`;

const documentFindMany = resolverWrapper(
  Joi.object({
    databaseName,
    collectionName,
  }),
  async (_root: unknown, args: TCollectionRequest, ctx: AppContext) =>
    readManyDocuments(args.databaseName, args.collectionName, ctx.userName)
);

type TAggregationResolver = {
  JSON: typeof GraphQLJSON;
  Query: {
    documentFindMany: typeof documentFindMany;
  };
};

export const resolversAggregation: TAggregationResolver = {
  JSON: GraphQLJSON,
  Query: {
    documentFindMany,
  },
};
