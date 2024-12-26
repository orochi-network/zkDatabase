import { Ownership, PermissionSecurity } from '@domain';
import {
  collectionName,
  databaseName,
  docId,
  EOwnershipType,
  TOwnershipTransferRequest,
  TOwnershipTransferResponse,
  TPermissionSetRequest,
  TPermissionSetResponse,
  userName,
} from '@zkdb/common';
import { PermissionBase } from '@zkdb/permission';
import { withTransaction } from '@zkdb/storage';
import GraphQLJSON from 'graphql-type-json';
import Joi from 'joi';
import { authorizeWrapper } from '../validation';
import { gql } from '@helper';

export const typeDefsPermission = gql`
  #graphql
  scalar JSON
  type Query
  type Mutation

  enum OwnershipGroup {
    User
    Group
  }

  extend type Mutation {
    permissionSet(
      databaseName: String!
      collectionName: String!
      docId: String
      permission: Int!
    ): Boolean!

    ownershipTransfer(
      databaseName: String!
      collectionName: String!
      docId: String
      groupType: OwnershipGroup!
      newOwner: String!
    ): Boolean!
  }
`;

// Mutation
const permissionSet = authorizeWrapper<
  TPermissionSetRequest,
  TPermissionSetResponse
>(
  Joi.object({
    databaseName,
    collectionName,
    docId: docId(false),
    permission: Joi.number().min(0).required(),
  }),
  async (_root, { databaseName, collectionName, docId, permission }, context) =>
    await withTransaction((session) =>
      PermissionSecurity.setPermission(
        databaseName,
        collectionName,
        docId,
        context.userName,
        PermissionBase.from(permission),
        session
      )
    )
);

const ownershipTransfer = authorizeWrapper<
  TOwnershipTransferRequest,
  TOwnershipTransferResponse
>(
  Joi.object({
    databaseName,
    collectionName,
    docId: docId(false),
    groupType: Joi.string()
      .valid(...Object.values(EOwnershipType))
      .required(),
    newOwner: userName,
  }),
  async (
    _root: unknown,
    { databaseName, collectionName, docId, groupType, newOwner },
    context
  ) =>
    await withTransaction((session) => {
      if (docId) {
        // Document case with docId
        return Ownership.transferDocument(
          {
            databaseName,
            collectionName,
            docId,
            groupType,
            newOwner,
            actor: context.userName,
          },
          session
        );
      } else {
        // Collection case without docId
        return Ownership.transferCollection(
          {
            databaseName,
            collectionName,
            groupType,
            newOwner,
            actor: context.userName,
          },
          session
        );
      }
    })
);

export const resolversPermission = {
  JSON: GraphQLJSON,
  Query: {},
  Mutation: {
    permissionSet,
    ownershipTransfer,
  },
};
