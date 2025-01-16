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
import { withCompoundTransaction, withTransaction } from '@zkdb/storage';
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

enum MinaTransactionStatus {
  Applied
  Failed
  Pending
}

type RollupOnChainHistoryItem {
  databaseName: String!;
  step: Int!;
  merkleRootOnChainNew: string;
  merkleRootOnChainOld: string;
  transactionObjectId: String;
  rollupOffChainObjectId: String;
  status: MinaTransactionStatus;
  error: String;
}

type RollupOffChainHistoryItem {

}

type RollupOnChainHistoryListResponse {
  data: [RollupHistoryItem]!
  total: Int!
  offset: Int!
}

type RollupOffChainHistoryListResponse {
  data: []!
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
  rollupOnChainHistory(query: JSON, pagination: PaginationInput): RollupOnChainHistoryListResponse!
  rollupOffChainHistory(query: JSON, pagination: PaginationInput): RollupOffChainHistoryListResponse!
  rollupState(databaseName: String!): RollupState
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
  databaseName: Joi.string().optional(),
  merkleRootNew: Joi.string().optional(),
  merkleRootOld: Joi.string().optional(),
});

const JOI_ROLLUP_ONCHAIN_HISTORY_LIST =
  Joi.object<TRollupOnChainHistoryRequest>({
    query: SchemaRollupOnChainHistoryRecordQuery.required(),
    pagination,
  });

const JOI_ROLLUP_OFFCHAIN_HISTORY_LIST =
  Joi.object<TRollupOnChainHistoryRequest>({
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
  withTransaction(
    async (session) => Rollup.offChainHistory(args, session),
    'proofService'
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
    const result = await withCompoundTransaction(async (compoundSession) =>
      Rollup.create(databaseName, ctx.userName, compoundSession)
    );
    return result === null ? false : result;
  }
);

export const resolversRollup = {
  Query: {
    rollupOnChainHistory,
    rollupOffChainHistory,
    rollupState,
  },
  Mutation: {
    rollupCreate,
  },
};
