import Joi from 'joi';
import GraphQLJSON from 'graphql-type-json';
import { withTransaction } from '@zkdb/storage';
import resolverWrapper from '../validation';
import {
  databaseName,
  groupDescription,
  groupName,
  groupOptionalDescription,
  userName,
} from './common';
import { TDatabaseRequest } from './database';
import ModelGroup from '../../model/database/group';
import ModelUserGroup from '../../model/database/user-group';
import { TCollectionRequest } from './collection';
import { addUsersToGroup, changeGroupDescription, createGroup } from '../../domain/use-case/group';
import { AppContext } from '../../common/types';

export type TGroupRequest = TCollectionRequest & {
  groupName: string;
};

export type TGroupCreateRequest = TGroupRequest & {
  groupDescription: string;
};

export type TGroupAddUsersRequest = TGroupRequest & {
  groupDescription: string;
  userNames: string[];
};

export const GroupCreateRequest = Joi.object<TGroupCreateRequest>({
  databaseName,
  groupName,
  groupDescription: groupOptionalDescription,
});

export const GroupDescriptionChangeRequest = Joi.object<TGroupCreateRequest>({
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

  groupAddUsers(
    databaseName: String!,
    groupName: String!,
    userNames: [String!]!
  ): Boolean

  groupChangeDescription(
    databaseName: String!,
    groupName: String!,
    newGroupDescription: String!
  )
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

const groupAddUsers = resolverWrapper(
  Joi.object({
    databaseName,
    groupName,
    userNames: Joi.array().items(Joi.string().required()).required(),
  }),
  async (_root: unknown, args: TGroupAddUsersRequest, ctx: AppContext) =>
    withTransaction(async (session) =>
      addUsersToGroup(
        args.databaseName,
        ctx.userName,
        args.groupName,
        args.userNames,
        session
      )
    )
);

const groupChangeDescription = resolverWrapper(
  GroupDescriptionChangeRequest,
  async (_root: unknown, args: TGroupCreateRequest, ctx: AppContext) =>
    withTransaction(async (session) =>
      changeGroupDescription(
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
    groupAddUsers: typeof groupAddUsers;
    groupChangeDescription: typeof groupChangeDescription;
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
    groupAddUsers,
    groupChangeDescription
  },
};
