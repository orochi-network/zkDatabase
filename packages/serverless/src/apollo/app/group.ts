import Joi from 'joi';
import GraphQLJSON from 'graphql-type-json';
import { withTransaction } from '@zkdb/storage';
import resolverWrapper from '../validation';
import { databaseName, groupDescription, groupName, userName } from './common';
import { TDatabaseRequest } from './database';
import ModelGroup from '../../model/database/group';
import ModelUserGroup from '../../model/database/user-group';
import { TCollectionRequest } from './collection';
import { createGroup } from '../../domain/use-case/group';
import { AppContext } from '../../common/types';

export type TGroupCreateRequest = TCollectionRequest & {
  groupName: string;
  groupDescription: string;
};

export const GroupCreateRequest = Joi.object<TGroupCreateRequest>({
  databaseName,
  groupName,
  groupDescription,
});

export const typeDefsGroup = `#graphql
scalar JSON
type Query
type Mutation

extend type Query {
  groupListAll(databaseName: String!): [String]
  groupListByUser(databaseName: String!, userName: String!): [String]
}

extend type Mutation {
  groupCreate(
    databaseName: String!,
    groupName: String!,
    groupDescription: String
  ): Boolean
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

const groupCreate = resolverWrapper(
  GroupCreateRequest,
  async (_root: unknown, args: TGroupCreateRequest, ctx: AppContext) =>
    withTransaction(async (session) =>
      createGroup(
        args.databaseName,
        ctx.userName,
        args.groupName,
        args.groupDescription,
        session
      )
    )
);

type TGroupResolver = {
  JSON: typeof GraphQLJSON;
  Query: {
    groupListAll: typeof groupListAll;
    groupListByUser: typeof groupListByUser;
  };
  Mutation: {
    groupCreate: typeof groupCreate;
  };
};

export const resolversGroup: TGroupResolver = {
  JSON: GraphQLJSON,
  Query: {
    groupListAll,
    groupListByUser,
  },
  Mutation: {
    groupCreate,
  },
};
