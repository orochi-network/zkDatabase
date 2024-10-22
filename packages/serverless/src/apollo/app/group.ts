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
import ModelGroup from '../../model/database/group.js';
import ModelUserGroup from '../../model/database/user-group.js';
import publicWrapper, { authorizeWrapper } from '../validation.js';
import {
  databaseName,
  groupDescription,
  groupName,
  groupOptionalDescription,
  networkId,
  userName,
} from './common.js';
import { TDatabaseRequest } from './database.js';

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
  networkId,
});

export const GroupDescriptionChangeRequest = Joi.object<TGroupCreateRequest>({
  databaseName,
  groupName,
  groupDescription,
  networkId,
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
  groupListAll(networkId: NetworkId!, databaseName: String!): [GroupInfo]!
  groupListByUser(networkId: NetworkId!, databaseName: String!, userName: String!): [String]!
  groupInfoDetail(networkId: NetworkId!, databaseName: String!, groupName: String!): GroupInfoDetail!
}

extend type Mutation {
  groupCreate(
    networkId: NetworkId!,
    databaseName: String!,
    groupName: String!,
    groupDescription: String
  ): Boolean

  groupAddUsers(
    networkId: NetworkId!,
    databaseName: String!,
    groupName: String!,
    userNames: [String!]!
  ): Boolean

  groupRemoveUsers(
    networkId: NetworkId!,
    databaseName: String!,
    groupName: String!,
    userNames: [String!]!
  ): Boolean

  groupChangeDescription(
    networkId: NetworkId!,
    databaseName: String!,
    groupName: String!,
    groupDescription: String!
  ): Boolean

  groupRename(
    networkId: NetworkId!,
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
    networkId,
  }),
  async (_root: unknown, args: TDatabaseRequest) => {
    const modelGroup = ModelGroup.getInstance(
      args.databaseName,
      args.networkId
    );
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
    networkId,
  }),
  async (_root: unknown, args: TGroupListByUserRequest) => {
    const modelUserGroup = ModelUserGroup.getInstance(
      args.databaseName,
      args.networkId
    );
    return modelUserGroup.listGroupByUserName(args.userName, args.networkId);
  }
);

const groupInfoDetail = publicWrapper(
  Joi.object({
    databaseName,
    groupName,
    networkId,
  }),
  async (_root: unknown, args: TGroupRequest) => {
    const group = await getGroupInfo(
      args.databaseName,
      args.groupName,
      args.networkId
    );
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
    networkId,
  }),
  async (_root: unknown, args: TGroupRenameRequest, ctx) =>
    withTransaction(async (session) =>
      renameGroup(
        args.databaseName,
        ctx.userName,
        args.groupName,
        args.newGroupName,
        args.networkId,
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
        args.networkId,
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
    networkId,
  }),
  async (_root: unknown, args: TGroupAddUsersRequest, ctx) =>
    withTransaction(async (session) =>
      addUsersToGroup(
        args.databaseName,
        ctx.userName,
        args.groupName,
        args.userNames,
        args.networkId,
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
        args.networkId,
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
        args.networkId,
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
