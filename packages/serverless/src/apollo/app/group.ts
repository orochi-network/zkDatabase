import {
  TDatabaseRequest,
  TGroupAddUsersRequest,
  TGroupCreateRequest,
  TGroupRenameRequest,
  TGroupRequest,
} from '@zkdb/common';
import { withTransaction } from '@zkdb/storage';
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
import { gql } from '../../helper/common.js';
import ModelGroup from '../../model/database/group.js';
import ModelUserGroup from '../../model/database/user-group.js';
import { publicWrapper, authorizeWrapper } from '../validation.js';
import {
  databaseName,
  groupDescription,
  groupName,
  userName,
} from './common.js';

export const GroupCreateRequest = Joi.object<TGroupCreateRequest>({
  databaseName,
  groupName,
  groupDescription: groupDescription(false),
});

export const GroupDescriptionChangeRequest = Joi.object<TGroupCreateRequest>({
  databaseName,
  groupName,
  groupDescription: groupDescription(false),
});

export const typeDefsGroup = gql`
  #graphql
  scalar JSON
  type Query
  type Mutation

  type Member {
    userName: String!
    updatedAt: String!
    createdAt: String!
  }

  type GroupInfoDetail {
    groupName: String!
    description: String!
    createBy: String!
    updatedAt: String!
    createdAt: String!
    listMember: [Member]!
  }

  type GroupInfo {
    groupName: String!
    description: String!
    createBy: String!
    updatedAt: String!
    createdAt: String!
  }

  extend type Query {
    groupListAll(databaseName: String!): [GroupInfo]

    groupListByUser(databaseName: String!, userName: String!): [String]

    groupInfoDetail(databaseName: String!, groupName: String!): GroupInfoDetail
  }

  extend type Mutation {
    groupCreate(
      databaseName: String!
      groupName: String!
      groupDescription: String
    ): Boolean

    groupAddUser(
      databaseName: String!
      groupName: String!
      listUser: [String!]!
    ): Boolean

    groupRemoveUser(
      databaseName: String!
      groupName: String!
      listUser: [String!]!
    ): Boolean

    groupUpdate(
      databaseName: String!
      groupName: String!
      newGroupName: String
      newGroupDescription: String
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
