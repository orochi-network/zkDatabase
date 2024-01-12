import Joi from 'joi';
import GraphQLJSON from 'graphql-type-json';
import resolverWrapper from '../validation';
import { databaseName, username } from './common';
import { TDatabaseRequest } from './database';
import ModelGroup from '../../model/global/group';
import ModelUserGroup from '../../model/global/user-group';

export const typeDefsGroup = `#graphql
scalar JSON
type Query
type Mutation

extend type Query {
  groupListAll(databaseName: String!): [String]
  groupListByUser(databaseName: String!, username: String!): [String]
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
  username: string;
};

const groupListByUser = resolverWrapper(
  Joi.object({
    databaseName,
    username,
  }),
  async (_root: unknown, args: TGroupListByUserRequest) => {
    const modelUserGroup = new ModelUserGroup(args.databaseName);
    return modelUserGroup.listUserGroupName(args.username);
  }
);

export const resolversGroup = {
  JSON: GraphQLJSON,
  Query: {
    groupListAll,
    groupListByUser,
  },
};
