import {
  collectionName,
  databaseName,
  objectId,
  TMetadataCollection,
  TMetadataCollectionRequest,
  TMetadataDocument,
  TMetadataDocumentRequest,
  TOwnershipDocumentOwnRequest,
  userName,
} from '@zkdb/common';
import { withTransaction } from '@zkdb/storage';
import GraphQLJSON from 'graphql-type-json';
import Joi from 'joi';

import { Metadata } from '../../domain/use-case/metadata.js';

import { PermissionSecurity } from '../../domain/use-case/permission-security.js';
import { authorizeWrapper } from '../validation.js';
import { Ownership } from '../../domain/use-case/ownership.js';

const ownershipGroup = Joi.string().valid('User', 'Group').required();

export const typeDefsPermission = `#graphql
scalar JSON
type Query
type Mutation

enum PermissionGroup {
  User
  Group
  Other
}

enum OwnershipGroup {
  User
  Group
}

type TMetadataDocument {
  owner: String!
  group: String!
  permission: Int!
  collectionName: String!
  docId: String!
  merkleIndex: String!
}

extend type Query {
  getMetadataDocument(
    databaseName: String!
    collectionName: String!
    docId: String!
  ): TMetadataDocument

 # TODO: keep JSON for now since we have to make sure what it will return
  getMetadataCollection(
    databaseName: String!
    collectionName: String!
  ): JSON 

  collectionSchema(
    databaseName: String!
    collectionName: String!
  ): [SchemaFieldOutput!]
}

extend type Mutation {
  permissionSet(
    databaseName: String!
    collectionName: String!
    docId: String
    permission: Int!
  ): CollectionMetadata!

  permissionTransferOwnership(
    databaseName: String!
    collectionName: String!
    docId: String
    grouping: OwnershipGroup!
    newOwner: String!
  ): Boolean
}
`;

// Query
const getMetadataDocument = authorizeWrapper<
  TMetadataDocumentRequest,
  TMetadataDocument
>(
  Joi.object({
    databaseName,
    collectionName,
    docId: objectId,
  }),
  async (_root, { databaseName, collectionName, docId }, ctx) => {
    const documentMetadata = await Metadata.document({
      databaseName,
      collectionName,
      docId,
      actor: ctx.userName,
    });

    if (!documentMetadata) {
      throw new Error(`Can't find metadata document: ${docId}`);
    }

    return documentMetadata;
  }
);

const getMetadataCollection = authorizeWrapper<
  TMetadataCollectionRequest,
  TMetadataCollection
>(
  Joi.object({
    databaseName,
    collectionName,
  }),
  async (_root, { databaseName, collectionName }, ctx) => {
    const collectionMetadata = await Metadata.collection({
      databaseName,
      collectionName,
      actor: ctx.userName,
    });

    if (!collectionMetadata) {
      throw new Error(`Can't find metadata collection: ${collectionName}`);
    }

    return collectionMetadata;
  }
);

// Mutation
const permissionSet = authorizeWrapper(
  Joi.object({
    databaseName,
    collectionName,
    permission: Joi.number().min(0).required(),
    docId: objectId.optional(),
  }),
  async (_root: unknown, args: any, context) => {
    await withTransaction((session) =>
      PermissionSecurity.setPermission(
        args.databaseName,
        args.collectionName,
        context.userName,
        args.docId,
        args.permission,
        session
      )
    );
  }
);

const permissionTransferOwnership = authorizeWrapper<
  TOwnershipDocumentOwnRequest,
  boolean
>(
  Joi.object({
    databaseName,
    collectionName,
    docId: objectId.optional(),
    grouping: ownershipGroup,
    newOwner: userName,
  }),
  async (
    _root: unknown,
    { databaseName, collectionName, docId, groupType, newOwner },
    context
  ) => {
    return Boolean(
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
  }
);

type TPermissionResolver = {
  JSON: typeof GraphQLJSON;
  Query: {
    getMetadataDocument: typeof getMetadataDocument;
    getMetadataCollection: typeof getMetadataCollection;
  };
  Mutation: {
    permissionSet: typeof permissionSet;
    permissionTransferOwnership: typeof permissionTransferOwnership;
  };
};

export const resolversPermission: TPermissionResolver = {
  JSON: GraphQLJSON,
  Query: {
    getMetadataCollection,
    getMetadataDocument,
  },
  Mutation: {
    permissionSet,
    permissionTransferOwnership,
  },
};
