import {
  TMerkleTreeInfoRequest,
  TMerkleTreeInfoResponse,
  TMerkleTreeNodeChildrenRequest,
  TMerkleTreeNodeChildrenResponse,
  TMerkleTreeNodeListByLevelRequest,
  TMerkleTreeNodeListByLevelResponse,
  TMerkleTreeNodePathRequest,
  TMerkleTreeNodePathResponse,
  TMerkleTreeProofByDocIdRequest,
  TMerkleTreeProofByDocIdResponse,
  TMerkleTreeProofByIndexRequest,
  TMerkleTreeProofByIndexResponse,
  databaseName,
  docId,
  merkleIndex,
  pagination,
} from '@zkdb/common';
import { ScalarType } from '@orochi-network/utilities';
import {
  ModelMerkleTree,
  withCompoundTransaction,
  withTransaction,
} from '@zkdb/storage';
import Joi from 'joi';
import { MerkleTree } from '@domain';
import { GraphQLScalarType } from 'graphql';
import { DEFAULT_PAGINATION } from '@common';
import { publicWrapper } from '../validation';

export const JOI_MERKLE_TREE_NODE_LIST_BY_LEVEL = Joi.object({
  databaseName,
  level: Joi.number().required(),
  pagination,
});

export const JOI_MERKLE_TREE_INFO = Joi.object({
  databaseName,
});

export const JOI_MERKLE_TREE_PROOF_BY_INDEX = Joi.object({
  databaseName,
  index: merkleIndex,
});

export const JOI_MERKLE_TREE_PROOF_BY_DOCID = Joi.object({
  databaseName,
  docId,
});

export const JOI_MERKLE_TREE_NODE_CHILDREN = Joi.object({
  databaseName,
  index: merkleIndex,
  level: Joi.number().required(),
});

export const typeDefsMerkleTree = `#graphql
scalar BigInt
type Query
type Mutation

type MerkleProof {
  isLeft: Boolean!
  sibling: String!
}

type MerkleNode {
  index: BigInt!
  level: Int!
  hash: String!
  empty: Boolean!
}

type MerkleNodeDetail {
  index: BigInt!
  level: Int!
  hash: String!
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

  merkleTreeInfo(databaseName: String!): MerkleTreeInfo!
  
  merkleProof(databaseName: String!, index: BigInt!): [MerkleProof]!
  
  merkleProofDocId(databaseName: String!, docId: String!): [MerkleProof]!

  merkleNodeByLevel(databaseName: String!, level: Int!, pagination: PaginationInput): MerkleNodePaginationOutput!
  
  merkleNodePath(databaseName: String!, docId: String!): [MerkleNodeDetail]!

  merkleNodeChildren(databaseName: String!, level: Int!, index: BigInt!): [MerkleNode!]!
}
`;

const merkleProof = publicWrapper<
  TMerkleTreeProofByIndexRequest,
  TMerkleTreeProofByIndexResponse
>(JOI_MERKLE_TREE_PROOF_BY_INDEX, async (_root, args) => {
  return withTransaction(async (session) => {
    const imMerkleTree = await ModelMerkleTree.getInstance(
      args.databaseName,
      session
    );
    const resultMerkleProof = await imMerkleTree.getMerkleProof(
      BigInt(args.index)
    );

    return resultMerkleProof.map((proof) => ({
      isLeft: proof.isLeft,
      sibling: proof.sibling.toString(),
    }));
  }, 'proofService');
});

const merkleProofDocId = publicWrapper<
  TMerkleTreeProofByDocIdRequest,
  TMerkleTreeProofByDocIdResponse
>(JOI_MERKLE_TREE_PROOF_BY_DOCID, async (_root, { databaseName, docId }) => {
  return withTransaction(async (session) => {
    const resultMerkleProofByDocId = await MerkleTree.document(
      databaseName,
      docId,
      session
    );
    return resultMerkleProofByDocId.map((proof) => {
      return {
        isLeft: proof.isLeft,
        sibling: proof.sibling.toString(),
      };
    });
  }, 'proofService');
});

const merkleNodeByLevel = publicWrapper<
  TMerkleTreeNodeListByLevelRequest,
  TMerkleTreeNodeListByLevelResponse
>(
  JOI_MERKLE_TREE_NODE_LIST_BY_LEVEL,
  async (_root, { databaseName, level, pagination }) =>
    withTransaction((session) =>
      MerkleTree.nodeByLevel(
        databaseName,
        level,
        pagination || DEFAULT_PAGINATION,
        session
      )
    )
);

const merkleTreeInfo = publicWrapper<
  TMerkleTreeInfoRequest,
  TMerkleTreeInfoResponse
>(JOI_MERKLE_TREE_INFO, async (_root, { databaseName }) =>
  withTransaction((session) => MerkleTree.info(databaseName, session))
);

const merkleNodeChildren = publicWrapper<
  TMerkleTreeNodeChildrenRequest,
  TMerkleTreeNodeChildrenResponse
>(
  JOI_MERKLE_TREE_NODE_CHILDREN,
  async (_root, { databaseName, level, index }) =>
    withTransaction((session) =>
      MerkleTree.nodeChildren(databaseName, level, index, session)
    )
);

const merkleNodePath = publicWrapper<
  TMerkleTreeNodePathRequest,
  TMerkleTreeNodePathResponse
>(JOI_MERKLE_TREE_PROOF_BY_DOCID, async (_root, { databaseName, docId }) =>
  withCompoundTransaction((compoundSession) =>
    MerkleTree.nodePath(databaseName, docId, compoundSession)
  )
);

const BigIntScalar: GraphQLScalarType<bigint, string> = ScalarType.BigInt();
export const resolversMerkleTree = {
  // If we put directly BigInt: ScalarType.BigInt() you will got
  // The inferred type of cannot be named without a reference
  // We need to have a temp variable that hold the function and explicit the type
  BigInt: BigIntScalar,
  Query: {
    merkleProof,
    merkleProofDocId,
    merkleNodeChildren,
    merkleNodeByLevel,
    merkleTreeInfo,
    merkleNodePath,
  },
};
