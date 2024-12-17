import {
  TDatabaseRequest,
  databaseName,
  transactionType,
  RollUpData,
} from '@zkdb/common';
import { withCompoundTransaction } from '@zkdb/storage';
import GraphQLJSON from 'graphql-type-json';
import Joi from 'joi';
import { Rollup } from '@domain';
import { authorizeWrapper } from '../validation.js';

export const typeDefsRollUp = `#graphql
scalar Date
type Mutation

enum RollUpState {
  updated
  outdated
  failed
}

type RollUpHistoryItem {
  databaseName: String!
  transactionType: TransactionType!
  txHash: String
  transactionRaw: String!
  status: TransactionStatus!
  merkletreeRootCurrent: String!
  merkletreeRootPrevious: String!
  createdAt: Date!
  updatedAt: Date!
  error: String
}

type RollUpHistory {
  state: RollUpState!,
  extraData: Int,
  history: [RollUpHistoryItem]!
}

extend type Mutation {
  rollupCreate(databaseName: String!): Boolean
  rollupHistory(databaseName: String!): RollUpHistory!
}
`;

const rollupHistory = authorizeWrapper<TDatabaseRequest, RollUpData>(
  Joi.object({
    databaseName,
  }),
  async (_root: unknown, args: TDatabaseRequest, ctx) =>
    Rollup.history(args.databaseName)
);

const rollupCreate = authorizeWrapper<TDatabaseRequest, boolean>(
  Joi.object({
    databaseName,
  }),
  async (_root: unknown, args: TDatabaseRequest, ctx) => {
    const result = await withCompoundTransaction((compoundSession) =>
      Rollup.create(args.databaseName, ctx.userName, compoundSession)
    );
    return result === null ? false : result;
  }
);

type TRollUpResolver = {
  JSON: typeof GraphQLJSON;
  Mutation: {
    rollupHistory: typeof rollupHistory;
    rollupCreate: typeof rollupCreate;
  };
};

export const resolversRollUp: TRollUpResolver = {
  JSON: GraphQLJSON,
  Mutation: {
    rollupHistory,
    rollupCreate,
  },
};
