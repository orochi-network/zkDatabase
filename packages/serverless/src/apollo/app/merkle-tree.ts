import Joi from 'joi';
import GraphQLJSON from 'graphql-type-json';
import { ModelMerkleTree, withTransaction } from '@zkdb/storage';
import { ObjectId } from 'mongodb';
import resolverWrapper from '../validation';
import { databaseName, indexNumber, objectId } from './common';
import { TDatabaseRequest } from './database';
import { getWitnessByDocumentId } from '../../domain/use-case/merkle-tree';

export type TMerkleTreeIndexRequest = TDatabaseRequest & {
  index: bigint;
};

export type TMerkleTreeWitnessByDocumentRequest = TDatabaseRequest & {
  docId: string;
};

export type TMerkleTreeGetNodeRequest = TMerkleTreeIndexRequest & {
  level: number;
};

export const MerkleTreeIndexRequest = Joi.object<TMerkleTreeIndexRequest>({
  databaseName,
  index: indexNumber,
});

export const MerkleTreeWitnessByDocumentRequest =
  Joi.object<TMerkleTreeWitnessByDocumentRequest>({
    databaseName,
    docId: objectId,
  });

export const MerkleTreeGetNodeRequest = Joi.object<TMerkleTreeGetNodeRequest>({
  databaseName,
  index: indexNumber,
  level: Joi.number().required(),
});

export const typeDefsMerkleTree = `#graphql
scalar JSON
type Query
type Mutation

type MerkleProof {
  isLeft: Boolean!
  sibling: String!
}

extend type Query {
  getNode(databaseName: String!, level: Int!, index: String!): String!
  getRoot(databaseName: String!): String!
  getWitness(databaseName: String!, root: String!, index: String!): [MerkleProof]!
  getWitnessByDocument(databaseName: String!, docId: String!): [MerkleProof]!
}
`;

const getWitness = resolverWrapper(
  MerkleTreeIndexRequest,
  async (_root: unknown, args: TMerkleTreeIndexRequest) => {
    const merkleTreeService = ModelMerkleTree.getInstance(args.databaseName);
    return withTransaction((session) =>
      merkleTreeService.getWitness(BigInt(args.index), new Date(), { session })
    );
  }
);

const getWitnessByDocument = resolverWrapper(
  MerkleTreeWitnessByDocumentRequest,
  async (_root: unknown, args: TMerkleTreeWitnessByDocumentRequest) => {
    return withTransaction((session) =>
      getWitnessByDocumentId(
        args.databaseName,
        new ObjectId(args.docId),
        session
      )
    );
  }
);

const getNode = resolverWrapper(
  MerkleTreeGetNodeRequest,
  async (_root: unknown, args: TMerkleTreeGetNodeRequest) => {
    const merkleTreeService = ModelMerkleTree.getInstance(args.databaseName);
    return withTransaction((session) =>
      merkleTreeService.getNode(args.level, args.index, new Date(), { session })
    );
  }
);

const getRoot = resolverWrapper(
  Joi.object({
    databaseName,
  }),
  async (_root: unknown, args: TDatabaseRequest) => {
    const merkleTreeService = ModelMerkleTree.getInstance(args.databaseName);
    return merkleTreeService.getRoot(new Date());
  }
);

type TMerkleTreeResolver = {
  JSON: typeof GraphQLJSON;
  Query: {
    getWitness: typeof getWitness;
    getNode: typeof getNode;
    getWitnessByDocument: typeof getWitnessByDocument;
    getRoot: typeof getRoot;
  };
};

export const resolversMerkleTree: TMerkleTreeResolver = {
  JSON: GraphQLJSON,
  Query: {
    getWitness,
    getNode,
    getWitnessByDocument,
    getRoot,
  },
};
