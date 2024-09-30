import { getWitnessByDocumentId } from '@domain';
import { ModelMerkleTree, withTransaction } from '@zkdb/storage';
import GraphQLJSON from 'graphql-type-json';
import Joi from 'joi';
import publicWrapper from '../validation';
import { databaseName, indexNumber, objectId } from './common';
import { TDatabaseRequest } from './database';

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

const getWitness = publicWrapper(
  MerkleTreeIndexRequest,
  async (_root: unknown, args: TMerkleTreeIndexRequest) => {
    const merkleTreeService = await ModelMerkleTree.load(args.databaseName);
    return withTransaction((session) =>
      merkleTreeService.getWitness(BigInt(args.index), new Date(), { session })
    );
  }
);

const getWitnessByDocument = publicWrapper(
  MerkleTreeWitnessByDocumentRequest,
  async (_root: unknown, args: TMerkleTreeWitnessByDocumentRequest) => {
    return withTransaction((session) =>
      getWitnessByDocumentId(args.databaseName, args.docId, session)
    );
  }
);

const getNode = publicWrapper(
  MerkleTreeGetNodeRequest,
  async (_root: unknown, args: TMerkleTreeGetNodeRequest) => {
    const merkleTreeService = await ModelMerkleTree.load(args.databaseName);
    return withTransaction((session) =>
      merkleTreeService.getNode(args.level, args.index, new Date(), { session })
    );
  }
);

const getRoot = publicWrapper(
  Joi.object({
    databaseName,
  }),
  async (_root: unknown, args: TDatabaseRequest) => {
    const merkleTreeService = await ModelMerkleTree.load(args.databaseName);
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
