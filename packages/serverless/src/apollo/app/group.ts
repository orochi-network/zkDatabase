import GraphQLJSON from 'graphql-type-json';
import Joi from 'joi';
import {
  addUsersToGroup,
  changeGroupDescription,
  createGroup,
  excludeUsersToGroup,
  getGroupInfo,
  renameGroup,
} from '../../domain/use-case/group.js';
import ModelGroup from '../../model/database/group.js';
import ModelUserGroup from '../../model/database/user-group.js';
import publicWrapper, { authorizeWrapper } from '../validation.js';
import {
  databaseName,
  groupDescription,
  groupName,
  groupOptionalDescription,
  userName,
} from './common.js';
import { TDatabaseRequest } from './database.js';
import { TransactionManager } from '@zkdb/storage';

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

type Member {
  userName: String!
  createdAt: String!,
}

type GroupInfoDetail {
  groupName: String!,
  description: String!,
  createdAt: String!,
  createBy: String!
  members: [Member]
}
type GroupInfo {
  groupName: String!
  description: String!
  createdAt: Int!
  createBy: String!
}

extend type Query {
  groupListAll(databaseName: String!): [GroupInfo]!
  groupListByUser(databaseName: String!, userName: String!): [String]!
  groupInfoDetail(databaseName: String!, groupName: String!): GroupInfoDetail!
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
      ...group,
      createdAt: group.createdAt.getSeconds(),
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

const groupInfoDetail = publicWrapper(
  Joi.object({
    databaseName,
    groupName,
  }),
  async (_root: unknown, args: TGroupRequest) => {
    const group = await getGroupInfo(args.databaseName, args.groupName);
    if (group) {
      return group;
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
    TransactionManager.withSingleTransaction('service', async (session) =>
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
    TransactionManager.withSingleTransaction('service', async (session) =>
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
    TransactionManager.withSingleTransaction('service', async (session) =>
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
    TransactionManager.withSingleTransaction('service', async (session) =>
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
    TransactionManager.withSingleTransaction('service', async (session) =>
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
    groupInfoDetail: typeof groupInfoDetail;
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
    groupInfoDetail,
  },
  Mutation: {
    groupCreate,
    groupAddUsers,
    groupChangeDescription,
    groupRemoveUsers,
    groupRename,
  },
};
