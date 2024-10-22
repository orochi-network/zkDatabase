import { ModelMerkleTree, withTransaction } from '@zkdb/storage';
import GraphQLJSON from 'graphql-type-json';
import Joi from 'joi';
import {
  getMerkleNodesByLevel,
  getWitnessByDocumentId,
  getMerkleWitnessPath,
  getMerkleTreeInfo as getMerkleTreeInfoDomain,
  getChildrenNodes as getChildrenNodesDomain,
} from '../../domain/use-case/merkle-tree.js';
import publicWrapper from '../validation.js';
import { databaseName, indexNumber, networkId, objectId, pagination } from './common.js';
import { TDatabaseRequest } from './database.js';
import { Pagination } from '../types/pagination.js';

export type TMerkleTreeIndexRequest = TDatabaseRequest & {
  index: bigint;
};

export type TMerkleTreeWitnessByDocumentRequest = TDatabaseRequest & {
  docId: string;
};

export type TMerkleTreeGetNodeRequest = TMerkleTreeIndexRequest & {
  level: number;
};

export type TMerkleTreeGetNodesByLevelRequest = TDatabaseRequest & {
  level: number;
  pagination: Pagination;
};

export const MerkleTreeGetNodesByLevelRequest =
  Joi.object<TMerkleTreeGetNodesByLevelRequest>({
    databaseName,
    level: Joi.number().required(),
    pagination,
    networkId
  });

export const MerkleTreeInfoRequest = Joi.object<TDatabaseRequest>({
  databaseName,
  networkId
});

export const MerkleTreeIndexRequest = Joi.object<TMerkleTreeIndexRequest>({
  databaseName,
  index: indexNumber,
  networkId,
});

export const MerkleTreeWitnessByDocumentRequest =
  Joi.object<TMerkleTreeWitnessByDocumentRequest>({
    databaseName,
    docId: objectId,
    networkId
  });

export const MerkleTreeGetNodeRequest = Joi.object<TMerkleTreeGetNodeRequest>({
  databaseName,
  index: indexNumber,
  level: Joi.number().required(),
  networkId
});

export const typeDefsMerkleTree = `#graphql
scalar JSON
type Query
type Mutation

type MerkleProof {
  isLeft: Boolean!
  sibling: String!
}

type MerkleNode {
  index: Int!,
  level: Int!,
  hash: String!
  empty: Boolean!
}

type MerkleWitnessNode {
  hash: String!
  level: Int!
  index: Int!
  witness: Boolean!
  target: Boolean!
}

type MerkleNodePaginationOutput {
  data: [MerkleNode]!
  totalSize: Int!
  offset: Int!
}

type MerkleTreeInfo {
  merkleRoot: String!
  merkleHeight: Int!
}

extend type Query {
  getNode(networkId: NetworkId!, databaseName: String!, level: Int!, index: String!): String!
  getNodesByLevel(networkId: NetworkId!, databaseName: String!, level: Int!, pagination: PaginationInput): MerkleNodePaginationOutput!
  getChildrenNodes(networkId: NetworkId!, databaseName: String!, level: Int!, index: String!): [MerkleNode!]!
  getMerkleTreeInfo(networkId: NetworkId!, databaseName: String!): MerkleTreeInfo!
  getRoot(networkId: NetworkId!, databaseName: String!): String!
  getWitness(networkId: NetworkId!, databaseName: String!, index: String!): [MerkleProof]!
  getWitnessByDocument(networkId: NetworkId!, databaseName: String!, docId: String!): [MerkleProof]!
  getWitnessPath(networkId: NetworkId!, databaseName: String!, docId: String!): [MerkleWitnessNode]!
}
`;

const getWitness = publicWrapper(
  MerkleTreeIndexRequest,
  async (_root: unknown, args: TMerkleTreeIndexRequest) => {
    const merkleTreeService = await ModelMerkleTree.load(args.databaseName, args.networkId);
    return merkleTreeService.getWitness(BigInt(args.index), new Date());
  }
);

const getWitnessByDocument = publicWrapper(
  MerkleTreeWitnessByDocumentRequest,
  async (_root: unknown, args: TMerkleTreeWitnessByDocumentRequest) => {
    return withTransaction((session) =>
      getWitnessByDocumentId(args.networkId, args.databaseName, args.docId, session)
    );
  }
);

const getNode = publicWrapper(
  MerkleTreeGetNodeRequest,
  async (_root: unknown, args: TMerkleTreeGetNodeRequest) => {
    const merkleTreeService = await ModelMerkleTree.load(args.databaseName, args.networkId);
    return withTransaction((session) =>
      merkleTreeService.getNode(args.level, args.index, new Date(), { session })
    );
  }
);

const getNodesByLevel = publicWrapper(
  MerkleTreeGetNodesByLevelRequest,
  async (_root: unknown, args: TMerkleTreeGetNodesByLevelRequest) =>
    getMerkleNodesByLevel(args.networkId, args.databaseName, args.level, args.pagination)
);

const getMerkleTreeInfo = publicWrapper(
  MerkleTreeInfoRequest,
  async (_root: unknown, args: TDatabaseRequest) =>
    getMerkleTreeInfoDomain(args.networkId, args.databaseName)
);

const getRoot = publicWrapper(
  Joi.object({
    databaseName,
  }),
  async (_root: unknown, args: TDatabaseRequest) => {
    const merkleTreeService = await ModelMerkleTree.load(args.databaseName, args.networkId);
    return merkleTreeService.getRoot(new Date());
  }
);

const getChildrenNodes = publicWrapper(
  MerkleTreeGetNodeRequest,
  async (_root: unknown, args: TMerkleTreeGetNodeRequest) =>
    getChildrenNodesDomain(args.networkId, args.databaseName, args.level, BigInt(args.index))
);

const getWitnessPath = publicWrapper(
  MerkleTreeWitnessByDocumentRequest,
  async (_root: unknown, args: TMerkleTreeWitnessByDocumentRequest) =>
    getMerkleWitnessPath(args.networkId, args.databaseName, args.docId)
);

type TMerkleTreeResolver = {
  JSON: typeof GraphQLJSON;
  Query: {
    getWitness: typeof getWitness;
    getNode: typeof getNode;
    getWitnessByDocument: typeof getWitnessByDocument;
    getRoot: typeof getRoot;
    getNodesByLevel: typeof getNodesByLevel;
    getMerkleTreeInfo: typeof getMerkleTreeInfo;
    getChildrenNodes: typeof getChildrenNodes;
    getWitnessPath: typeof getWitnessPath;
  };
};

export const resolversMerkleTree: TMerkleTreeResolver = {
  JSON: GraphQLJSON,
  Query: {
    getWitness,
    getNode,
    getWitnessByDocument,
    getRoot,
    getNodesByLevel,
    getMerkleTreeInfo,
    getChildrenNodes,
    getWitnessPath,
  },
};
