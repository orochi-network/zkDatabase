import { Ownership, PermissionSecurity } from '@domain';
import { gql } from '@helper';
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
import { Permission } from '@zkdb/permission';
import { Transaction } from '@zkdb/storage';
import Joi from 'joi';
import { authorizeWrapper } from '../validation';

export const typeDefsPermission = gql`
  #graphql
  type Query
  type Mutation

  enum OwnershipType {
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
      groupType: OwnershipType!
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
    await Transaction.serverless((session) =>
      PermissionSecurity.setPermission(
        databaseName,
        collectionName,
        docId,
        context.userName,
        Permission.from(permission),
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
    await Transaction.serverless((session) => {
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
  Query: {},
  Mutation: {
    permissionSet,
    ownershipTransfer,
  },
};
