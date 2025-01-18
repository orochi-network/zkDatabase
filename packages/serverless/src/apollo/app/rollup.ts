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
import { authorizeWrapper } from '../validation';
import { GraphQLScalarType } from 'graphql';
import { ScalarType } from '@orochi-network/utilities';

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
}

type RollupOnChainHistoryItem {
  databaseName: String!
  onChainStep: BigInt
  merkleRootOnChainNew: String!
  merkleRootOnChainOld: String!
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
  merkleRootOnChainNew: String
  merkleRootOnChainOld: String
  rollupDifferent: BigInt
  rollupOnChainState: RollupState!
  latestRollupOnChainSuccess: Date
}

extend type Query {
  rollupOnChainHistory(query: JSON, pagination: PaginationInput): RollupOnChainHistoryListResponse!
  rollupOffChainHistory(query: JSON, pagination: PaginationInput): RollupOffChainHistoryListResponse!
  rollupState(databaseName: String!): RollupOnChainState!
}

extend type Mutation {
  rollupCreate(databaseName: String!): Boolean 
}
`;
const SchemaRollupOnChainHistoryRecordQuery = Joi.object<
  TRollupOnChainHistoryRequest['query']
>({
  databaseName: Joi.string().optional(),
  merkleRootOnChainNew: Joi.string().optional(),
  merkleRootOnChainOld: Joi.string().optional(),
});

const SchemaRollupOffChainHistoryRecordQuery = Joi.object<
  TRollupOffChainHistoryRequest['query']
>({
  databaseName: Joi.string().required(),
  merkleRootNew: Joi.string().optional(),
  merkleRootOld: Joi.string().optional(),
});

const JOI_ROLLUP_ONCHAIN_HISTORY_LIST =
  Joi.object<TRollupOnChainHistoryRequest>({
    query: SchemaRollupOnChainHistoryRecordQuery.required(),
    pagination,
  });

const JOI_ROLLUP_OFFCHAIN_HISTORY_LIST =
  Joi.object<TRollupOffChainHistoryRequest>({
    query: SchemaRollupOffChainHistoryRecordQuery.required(),
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
  Transaction.minaService(async (session) =>
    Rollup.offChainHistory(args, session)
  )
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
