import { TransactionManager } from '@zkdb/storage';
import GraphQLJSON from 'graphql-type-json';
import Joi from 'joi';
import {
  createRollUp as createRollUpDomain,
  getRollUpHistory as getRollUpHistoryDomain,
} from '../../domain/use-case/rollup.js';
import { authorizeWrapper } from '../validation.js';
import { databaseName, transactionType } from './common.js';
import { TDatabaseRequest } from './database.js';

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
  transactionHash: String,
  status: TransactionStatus!,
  currentMerkleTreeRoot: String!,
  previousMerkleTreeRoot: String!,
  createdAt: Date!
  error: String
}

type RollUpHistory {
  state: RollUpState!,
  extraData: Int,
  history: [RollUpHistoryItem]!
}

extend type Mutation {
  getRollUpHistory(databaseName: String!): RollUpHistory!
  createRollUp(databaseName: String!): Boolean
}
`;

const getRollUpHistory = authorizeWrapper(
  Joi.object({
    databaseName,
    transactionType,
  }),
  async (_root: unknown, args: TDatabaseRequest, ctx) =>
    getRollUpHistoryDomain(args.databaseName)
);

const createRollUp = authorizeWrapper(
  Joi.object({
    databaseName,
  }),
  async (_root: unknown, args: TDatabaseRequest, ctx) =>
    TransactionManager.withCompoundTransaction((compoundSession) =>
      createRollUpDomain(args.databaseName, ctx.userName, undefined)
    )
);

type TRollUpResolver = {
  JSON: typeof GraphQLJSON;
  Mutation: {
    getRollUpHistory: typeof getRollUpHistory;
    createRollUp: typeof createRollUp;
  };
};

export const resolversRollUp: TRollUpResolver = {
  JSON: GraphQLJSON,
  Mutation: {
    getRollUpHistory,
    createRollUp,
  },
};
