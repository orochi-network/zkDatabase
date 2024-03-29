import Joi from 'joi';
import GraphQLJSON from 'graphql-type-json';
import resolverWrapper from '../validation';
import { databaseName, userName } from './common';
import { TDatabaseRequest } from './database';
import ModelGroup from '../../model/database/group';
import ModelUserGroup from '../../model/database/user-group';

export const typeDefsGroup = `#graphql
scalar JSON
type Query
type Mutation

extend type Query {
  groupListAll(databaseName: String!): [String]
  groupListByUser(databaseName: String!, userName: String!): [String]
}
`;

// Query
const groupListAll = resolverWrapper(
  Joi.object({
    databaseName,
  }),
  async (_root: unknown, args: TDatabaseRequest) => {
    const modelGroup = new ModelGroup(args.databaseName);
    return modelGroup.find({});
  }
);

export type TGroupListByUserRequest = TDatabaseRequest & {
  userName: string;
};

const groupListByUser = resolverWrapper(
  Joi.object({
    databaseName,
    userName,
  }),
  async (_root: unknown, args: TGroupListByUserRequest) => {
    const modelUserGroup = new ModelUserGroup(args.databaseName);
    return modelUserGroup.listGroupByUserName(args.userName);
  }
);

export const resolversGroup = {
  JSON: GraphQLJSON,
  Query: {
    groupListAll,
    groupListByUser,
  },
};
