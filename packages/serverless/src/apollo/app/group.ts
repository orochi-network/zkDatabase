import Joi from 'joi';
import GraphQLJSON from 'graphql-type-json';
import { withTransaction } from '@zkdb/storage';
import { ModelGroup, ModelUserGroup } from '@model';
import {
  addUsersToGroup,
  excludeUsersToGroup,
  changeGroupDescription,
  createGroup,
  renameGroup,
} from '@domain';
import publicWrapper, { authorizeWrapper } from '../validation';
import {
  databaseName,
  groupDescription,
  groupName,
  groupOptionalDescription,
  userName,
} from './common';
import { TDatabaseRequest } from './database';

export type TGroupRequest = TDatabaseRequest & {
  groupName: string;
};

export type TGroupRenameRequest = TGroupRequest & {
  newGroupName: string;
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

type GroupInfo {
  name: String!,
  description: String!,
  createdAt: Int!,
  createdBy: String!
}

extend type Query {
  groupListAll(databaseName: String!): [GroupInfo]!
  groupListByUser(databaseName: String!, userName: String!): [String]!
  groupInfo(databaseName: String!, groupName: String!): GroupInfo!
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

  groupRemoveUsers(
    databaseName: String!,
    groupName: String!,
    userNames: [String!]!
  ): Boolean

  groupChangeDescription(
    databaseName: String!,
    groupName: String!,
    groupDescription: String!
  ): Boolean

  groupRename(
    databaseName: String!,
    groupName: String!,
    newGroupName: String!
  ): Boolean
}
`;

// Query
const groupListAll = publicWrapper(
  Joi.object({
    databaseName,
  }),
  async (_root: unknown, args: TDatabaseRequest) => {
    const modelGroup = new ModelGroup(args.databaseName);
    const groups = await (await modelGroup.find({})).toArray();
    return groups.map((group) => ({
      name: group.groupName,
      description: group.description,
      createdAt: group.createdAt.getSeconds(),
      createdBy: group.createBy,
    }));
  }
);

export type TGroupListByUserRequest = TDatabaseRequest & {
  userName: string;
};

const groupListByUser = publicWrapper(
  Joi.object({
    databaseName,
    userName,
  }),
  async (_root: unknown, args: TGroupListByUserRequest) => {
    const modelUserGroup = new ModelUserGroup(args.databaseName);
    return modelUserGroup.listGroupByUserName(args.userName);
  }
);

const groupInfo = publicWrapper(
  Joi.object({
    databaseName,
    groupName,
  }),
  async (_root: unknown, args: TGroupRequest) => {
    const modelUserGroup = new ModelGroup(args.databaseName);
    const group = await modelUserGroup.findGroup(args.groupName);
    if (group) {
      return {
        name: group.groupName,
        description: group.description,
        createdAt: group.createdAt.getSeconds(),
        createdBy: group.createBy,
      };
    }
    throw Error(`Group ${args.groupName} does not exist`);
  }
);

const groupRename = authorizeWrapper(
  Joi.object({
    databaseName,
    groupName,
    newGroupName: groupName,
  }),
  async (_root: unknown, args: TGroupRenameRequest, ctx) =>
    withTransaction(async (session) =>
      renameGroup(
        args.databaseName,
        ctx.userName,
        args.groupName,
        args.newGroupName,
        session
      )
    )
);

const groupCreate = authorizeWrapper(
  GroupCreateRequest,
  async (_root: unknown, args: TGroupCreateRequest, ctx) =>
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

const groupAddUsers = authorizeWrapper(
  Joi.object({
    databaseName,
    groupName,
    userNames: Joi.array().items(Joi.string().required()).required(),
  }),
  async (_root: unknown, args: TGroupAddUsersRequest, ctx) =>
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

const groupRemoveUsers = authorizeWrapper(
  Joi.object({
    databaseName,
    groupName,
    userNames: Joi.array().items(Joi.string().required()).required(),
  }),
  async (_root: unknown, args: TGroupAddUsersRequest, ctx) =>
    withTransaction(async (session) =>
      excludeUsersToGroup(
        args.databaseName,
        ctx.userName,
        args.groupName,
        args.userNames,
        session
      )
    )
);

const groupChangeDescription = authorizeWrapper(
  GroupDescriptionChangeRequest,
  async (_root: unknown, args: TGroupCreateRequest, ctx) =>
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
    groupInfo: typeof groupInfo;
  };
  Mutation: {
    groupCreate: typeof groupCreate;
    groupAddUsers: typeof groupAddUsers;
    groupChangeDescription: typeof groupChangeDescription;
    groupRemoveUsers: typeof groupRemoveUsers;
    groupRename: typeof groupRename;
  };
};

export const resolversGroup: TGroupResolver = {
  JSON: GraphQLJSON,
  Query: {
    groupListAll,
    groupListByUser,
    groupInfo,
  },
  Mutation: {
    groupCreate,
    groupAddUsers,
    groupChangeDescription,
    groupRemoveUsers,
    groupRename,
  },
};
