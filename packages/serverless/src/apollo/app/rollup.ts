import Joi from 'joi';
import { authorizeWrapper } from '../validation.js';
import { databaseName, transactionType } from './common.js';
import { TDatabaseRequest } from './database.js';
import GraphQLJSON from 'graphql-type-json';
import { getRollUpHistory as getRollUpHistoryDomain} from '../../domain/use-case/rollup.js';

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
  txHash: String!,
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

type TRollUpResolver = {
  JSON: typeof GraphQLJSON;
  Mutation: {
    getRollUpHistory: typeof getRollUpHistory;
  };
};

export const resolversRollUp: TRollUpResolver = {
  JSON: GraphQLJSON,
  Mutation: {
    getRollUpHistory,
  },
};
