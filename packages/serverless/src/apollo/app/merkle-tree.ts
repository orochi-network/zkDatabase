import {
  TMerkleTreeChildrenNodeRequest,
  TMerkleTreeChildrenNodeResponse,
  TMerkleTreeInfoRequest,
  TMerkleTreeInfoResponse,
  TMerkleTreeListNodeRequest,
  TMerkleTreeListNodeResponse,
  TMerkleTreeProofByDocIdRequest,
  TMerkleTreeProofByDocIdResponse,
  TMerkleTreeProofByIndexRequest,
  TMerkleTreeProofByIndexResponse,
  TMerkleTreeProofPathRequest,
  TMerkleTreeProofPathResponse,
  databaseName,
  indexNumber,
  objectId,
  pagination,
} from '@zkdb/common';
import { ModelMerkleTree } from '@zkdb/storage';
import GraphQLJSON from 'graphql-type-json';
import Joi from 'joi';
import { MerkleTree } from '../../domain/use-case/merkle-tree.js';
import { publicWrapper } from '../validation.js';

export const JOI_MERKLE_TREE_LIST_NODE = Joi.object({
  databaseName,
  level: Joi.number().required(),
  pagination,
});

export const JOI_MERKLE_TREE_INFO = Joi.object({
  databaseName,
});

export const JOI_MERKLE_TREE_PROOF_BY_INDEX = Joi.object({
  databaseName,
  index: indexNumber,
});

export const JOI_MERKLE_TREE_PROOF_BY_DOCID = Joi.object({
  databaseName,
  docId: objectId,
});

export const JOI_MERKLE_TREE_GET_NODE = Joi.object({
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

type MerkleNode {
  index: Int!
  level: Int!
  hash: String!
  empty: Boolean!
}

type MerkleNodeDetail {
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

  merkleListNode(databaseName: String!, level: Int!, pagination: PaginationInput): MerkleNodePaginationOutput!
  
  merkleChildrenNode(databaseName: String!, level: Int!, index: String!): [MerkleNode!]!
  
  merkleTreeInfo(databaseName: String!): MerkleTreeInfo!
  
  merkleProof(databaseName: String!, index: String!): [MerkleProof]!
  
  merkleProofDocId(databaseName: String!, docId: String!): [MerkleProof]!
  
  merkleProofPath(databaseName: String!, docId: String!): [MerkleNodeDetail]!
}
`;

const merkleProof = publicWrapper<
  TMerkleTreeProofByIndexRequest,
  TMerkleTreeProofByIndexResponse
>(JOI_MERKLE_TREE_PROOF_BY_INDEX, async (_root, args) => {
  const imMerkleTree = await ModelMerkleTree.getInstance(args.databaseName);
  const resultMerkleProof = await imMerkleTree.getMerkleProof(
    BigInt(args.index),
    new Date()
  );

  return resultMerkleProof.map((proof) => ({
    isLeft: proof.isLeft,
    sibling: proof.sibling.toString(),
  }));
});

const merkleProofDocId = publicWrapper<
  TMerkleTreeProofByDocIdRequest,
  TMerkleTreeProofByDocIdResponse
>(JOI_MERKLE_TREE_PROOF_BY_DOCID, async (_root, { databaseName, docId }) => {
  const resultMerkleProofByDocId = await MerkleTree.document(
    databaseName,
    docId
  );
  return resultMerkleProofByDocId.map((proof) => {
    return {
      isLeft: proof.isLeft,
      sibling: proof.sibling.toString(),
    };
  });
});

const merkleListNode = publicWrapper<
  TMerkleTreeListNodeRequest,
  TMerkleTreeListNodeResponse
>(
  JOI_MERKLE_TREE_LIST_NODE,
  async (_root, { databaseName, level, pagination }) =>
    MerkleTree.merkleNodeByLevel(databaseName, level, pagination)
);

const merkleTreeInfo = publicWrapper<
  TMerkleTreeInfoRequest,
  TMerkleTreeInfoResponse
>(JOI_MERKLE_TREE_INFO, async (_root, { databaseName }) =>
  MerkleTree.merkleTreeInfo(databaseName)
);

const merkleChildrenNode = publicWrapper<
  TMerkleTreeChildrenNodeRequest,
  TMerkleTreeChildrenNodeResponse
>(JOI_MERKLE_TREE_GET_NODE, async (_root, { databaseName, level, index }) =>
  MerkleTree.getChildrenNode(databaseName, level, index)
);

const merkleProofPath = publicWrapper<
  TMerkleTreeProofPathRequest,
  TMerkleTreeProofPathResponse
>(JOI_MERKLE_TREE_PROOF_BY_DOCID, async (_root, { databaseName, docId }) =>
  MerkleTree.merkleProofPath(databaseName, docId)
);

export const resolversMerkleTree = {
  JSON: GraphQLJSON,
  Query: {
    merkleProof,
    merkleProofDocId,
    merkleChildrenNode,
    merkleListNode,
    merkleTreeInfo,
    merkleProofPath,
  },
};
