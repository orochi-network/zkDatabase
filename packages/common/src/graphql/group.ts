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
