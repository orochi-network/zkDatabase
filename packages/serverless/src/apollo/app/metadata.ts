import { Metadata } from '@domain';
import {
  collectionName,
  databaseName,
  docId,
  TMetadataCollection,
  TMetadataCollectionRequest,
  TMetadataDocument,
  TMetadataDocumentRequest,
} from '@zkdb/common';
import GraphQLJSON from 'graphql-type-json';
import Joi from 'joi';
import { authorizeWrapper } from '../validation';
import { gql } from '@helper';

export const typeDefsMetadata = gql`
  #graphql
  scalar JSON
  type Query
  type Mutation

  type MetadataDocumentResponse {
    owner: String!
    group: String!
    permission: Int!
    collectionName: String!
    docId: String!
    merkleIndex: String!
  }

  # @TODO Refactor after document
  extend type Query {
    documentMetadata(
      databaseName: String!
      collectionName: String!
      docId: String!
    ): MetadataDocumentResponse

    # TODO: keep JSON for now since we have to make sure what it will return
    collectionMetadata(
      databaseName: String!
      collectionName: String!
    ): MetadataCollection!
  }
`;

// Query
const documentMetadata = authorizeWrapper<
  TMetadataDocumentRequest,
  TMetadataDocument
>(
  Joi.object({
    databaseName,
    collectionName,
    docId,
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

const collectionMetadata = authorizeWrapper<
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

export const resolversMetadata = {
  JSON: GraphQLJSON,
  Query: {
    collectionMetadata,
    documentMetadata,
  },
  Mutation: {},
};
