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
import {
  readCollectionMetadata,
  readDocumentMetadata,
} from '../../domain/use-case/metadata.js';
import {
  changeCollectionOwnership,
  changeDocumentOwnership,
} from '../../domain/use-case/ownership.js';
import { PermissionSecurity } from '../../domain/use-case/permission-security.js';
import { authorizeWrapper } from '../validation.js';

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

type DocumentMetadataOutput {
  _id: String!
  createdAt: Date!
  updatedAt: Date!
  owner: String!
  group: String!
  permission: Int!
  collection: String!
  docId: String!
  merkleIndex: String!
}

extend type Query {
  getMetadataDocument(
    databaseName: String!
    collectionName: String!
    docId: String!
  ): DocumentMetadataOutput

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
  async (_root, args, ctx) => {
    const documentMetadata = await readDocumentMetadata(
      args.databaseName,
      args.collectionName,
      args.docId,
      ctx.userName,
      true
    );

    if (!documentMetadata) {
      throw new Error(`Can't find metadata document: ${args.docId}`);
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
  async (_root, args, ctx) => {
    const collectionMetadata = await readCollectionMetadata(
      args.databaseName,
      args.collectionName,
      ctx.userName,
      true
    );

    if (!collectionMetadata) {
      throw new Error(`Can't find metadata collection: ${args.collectionName}`);
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
  async (_root: unknown, args, context) => {
    return Boolean(
      await withTransaction((session) => {
        if (args.docId) {
          // Document case with docId
          return changeDocumentOwnership(
            args.databaseName,
            args.collectionName,
            args.docId,
            context.userName,
            args.groupType,
            args.newOwner,
            session
          );
        } else {
          // Collection case without docId
          return changeCollectionOwnership(
            args.databaseName,
            args.collectionName,
            context.userName,
            args.groupType,
            args.newOwner,
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
