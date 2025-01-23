import { Rollup } from '@domain';
import {
  databaseName,
  pagination,
  TRollupOffChainHistoryRequest,
  TRollupOffChainHistoryResponse,
  TRollupOnChainCreateRequest,
  TRollupOnChainCreateResponse,
  TRollupOnChainHistoryRequest,
  TRollupOnChainHistoryResponse,
  TRollupOnChainStateRequest,
  TRollupOnChainStateResponse,
} from '@zkdb/common';
import { Transaction } from '@zkdb/storage';
import Joi from 'joi';
import { GraphQLScalarType } from 'graphql';
import { ScalarType } from '@orochi-network/utilities';
import { authorizeWrapper } from '../validation';

export const typeDefsRollup = `#graphql
scalar Date
scalar BigInt
type Mutation

enum RollupState {
  Updated
  Updating
  Outdated
  Failed
}

enum QueueTaskStatus {
  Queued 
  Processing 
  Failed 
  Success 
  Unknown
}

type RollupOnChainHistoryItem {
  databaseName: String!
  onChainStep: BigInt
  merkleRootNew: String!
  merkleRootOld: String!
  status: TransactionStatus
  error: String
  txHash: String
}

type RollupOffChainHistoryItem {
  databaseName: String!
  collectionName: String!
  merkleRootOld: String!
  merkleRootNew: String
  error: String
  docId: String!
  status: QueueTaskStatus
  step: BigInt
  acquiredAt: Date!
}

type RollupOnChainHistoryListResponse {
  data: [RollupOnChainHistoryItem]!
  total: Int!
  offset: Int!
}

type RollupOffChainHistoryListResponse {
  data: [RollupOffChainHistoryItem]!
  total: Int!
  offset: Int!
}

type RollupOnChainState {
  databaseName: String!
  merkleRootNew: String
  merkleRootOld: String
  rollupDifferent: BigInt
  rollupOnChainState: RollupState!
  latestRollupOnChainSuccess: Date
}

extend type Query {
  rollupOnChainHistory(databaseName: String!, pagination: PaginationInput): RollupOnChainHistoryListResponse!
  rollupOffChainHistory(databaseName: String!, pagination: PaginationInput): RollupOffChainHistoryListResponse!
  rollupState(databaseName: String!): RollupOnChainState
}

extend type Mutation {
  rollupCreate(databaseName: String!): Boolean 
}
`;

const JOI_ROLLUP_ONCHAIN_HISTORY_LIST =
  Joi.object<TRollupOnChainHistoryRequest>({
    databaseName,
    pagination,
  });

const JOI_ROLLUP_OFFCHAIN_HISTORY_LIST =
  Joi.object<TRollupOffChainHistoryRequest>({
    databaseName,
    pagination,
  });

// Query
const rollupState = authorizeWrapper<
  TRollupOnChainStateRequest,
  TRollupOnChainStateResponse
>(Joi.object({ databaseName }), async (_root, { databaseName }) =>
  Rollup.state(databaseName)
);

const rollupOnChainHistory = authorizeWrapper<
  TRollupOnChainHistoryRequest,
  TRollupOnChainHistoryResponse
>(JOI_ROLLUP_ONCHAIN_HISTORY_LIST, async (_root, args) =>
  Rollup.onChainHistory(args)
);

const rollupOffChainHistory = authorizeWrapper<
  TRollupOffChainHistoryRequest,
  TRollupOffChainHistoryResponse
>(JOI_ROLLUP_OFFCHAIN_HISTORY_LIST, async (_root, args) =>
  Transaction.mina(async (session) => Rollup.offChainHistory(args, session))
);

// Mutation
const rollupCreate = authorizeWrapper<
  TRollupOnChainCreateRequest,
  TRollupOnChainCreateResponse
>(
  Joi.object({
    databaseName,
  }),
  async (_root, { databaseName }, ctx) => {
    const result = await Transaction.compound(async (compoundSession) =>
      Rollup.create(databaseName, ctx.userName, compoundSession)
    );
    return result === null ? false : result;
  }
);

const BigIntScalar: GraphQLScalarType<bigint, string> = ScalarType.BigInt();

export const resolversRollup = {
  // If we put directly BigInt: ScalarType.BigInt() you will got
  // The inferred type of cannot be named without a reference
  // We need to have a temp variable that hold the function and explicit the type
  BigInt: BigIntScalar,
  Query: {
    rollupOnChainHistory,
    rollupOffChainHistory,
    rollupState,
  },
  Mutation: {
    rollupCreate,
  },
};
