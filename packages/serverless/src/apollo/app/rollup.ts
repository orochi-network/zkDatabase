import { Rollup } from '@domain';
import {
  databaseName,
  TRollupCreateRequest,
  TRollupCreateResponse,
  TRollupHistoryRequest,
  TRollupHistoryResponse,
  TRollupStateRequest,
  TRollupStateResponse,
  pagination,
} from '@zkdb/common';
import { withCompoundTransaction } from '@zkdb/storage';
import Joi from 'joi';
import { authorizeWrapper } from '../validation';

export const typeDefsRollup = `#graphql
scalar Date
type Mutation

enum RollupState {
  Updated
  Updating
  Outdated
  Failed
}

type RollupHistoryItem {
  databaseName: String!
  txHash: String
  transactionRaw: String!
  status: TransactionStatus!
  merkleTreeRoot: String!
  merkleTreeRootPrevious: String!
  error: String
  createdAt: Date!
  updatedAt: Date!
}

type RollupHistoryListResponse {
  data: [RollupHistoryItem]!
  total: Int!
  offset: Int!
}

type RollupState {
  state: RollupState,
  merkleTreeRoot: String!
  merkleTreeRootPrevious: String!
  rollUpDifferent: Int,
  latestRollupSuccess: Date
}

extend type Query {
  rollupHistory(query: JSON, pagination: PaginationInput): RollupHistoryListResponse!
  rollupState(databaseName: String!): RollupState
}

extend type Mutation {
  rollupCreate(databaseName: String!): Boolean 
}
`;
const SchemaRollupHistoryRecordQuery = Joi.object<
  TRollupHistoryRequest['query']
>({
  databaseName: Joi.string().optional(),
  merkleTreeRoot: Joi.string().optional(),
  merkleTreeRootPrevious: Joi.string().optional(),
});

const JOI_ROLLUP_HISTORY_LIST = Joi.object<TRollupHistoryRequest>({
  query: SchemaRollupHistoryRecordQuery.required(),
  pagination,
});

// Query
const rollupState = authorizeWrapper<TRollupStateRequest, TRollupStateResponse>(
  Joi.object({ databaseName }),
  async (_root, { databaseName }) => Rollup.state(databaseName)
);

const rollupOnChainHistory = authorizeWrapper<
  TRollupHistoryRequest,
  TRollupHistoryResponse
>(JOI_ROLLUP_HISTORY_LIST, async (_root, args) => {
  return Rollup.onChainHistory(args);
});

// Mutation
const rollupCreate = authorizeWrapper<
  TRollupCreateRequest,
  TRollupCreateResponse
>(
  Joi.object({
    databaseName,
  }),
  async (_root, { databaseName }, ctx) => {
    const result = await withCompoundTransaction(async (compoundSession) =>
      Rollup.create(databaseName, ctx.userName, compoundSession)
    );
    return result === null ? false : result;
  }
);

export const resolversRollup = {
  Query: {
    rollupOnChainHistory,
    rollupState,
  },
  Mutation: {
    rollupCreate,
  },
};
