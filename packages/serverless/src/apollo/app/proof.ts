import { gql } from '@helper';
import {
  databaseName,
  EQueueTaskStatus,
  TProverStatusRequest,
  TProverStatusResponse,
  TProverRetryRequest,
  TProverRetryResponse,
  TZkProofRequest,
  TZkProofResponse,
  TZkProofStatusRequest,
  TZkProofStatusResponse,
  TRollupOffChainRecord,
} from '@zkdb/common';
import {
  EQueueType,
  ModelGenericQueue,
  ModelRollupOffChain,
  Transaction,
} from '@zkdb/storage';
import { Joi } from '@orochi-network/framework';
import { GraphQLScalarType } from 'graphql';
import { ScalarType } from '@orochi-network/utilities';
import { PermissionSecurity } from '@domain';
import { Filter } from 'mongodb';
import { authorizeWrapper, publicWrapper } from '../validation';

export const JOI_PROVER_STATUS = Joi.object({
  databaseName,
});

export const typeDefsProof = gql`
  #graphql
  type Query
  scalar BigInt
  # TZkDatabaseProof in TS
  type JsonProof {
    publicInput: [String!]!
    publicOutput: [String!]!
    maxProofsVerified: Int!
    proof: String!
  }

  type ZkProof {
    step: BigInt!
    proof: JsonProof!
  }

  extend type Query {
    zkProofStatus(databaseName: String!): QueueTaskStatus

    zkProof(databaseName: String!, step: BigInt): ZkProof

    proverStatus(databaseName: String!): QueueTaskStatus!
  }

  extend type Mutation {
    proverRetry(databaseName: String!): Boolean!
  }
`;

const zkProof = publicWrapper<TZkProofRequest, TZkProofResponse>(
  Joi.object({
    databaseName,
    step: Joi.bigint().optional(),
  }),
  async (_root, { databaseName, step }) => {
    let filter: Filter<TRollupOffChainRecord> = { databaseName };

    if (step) {
      filter = { ...filter, step: BigInt(step) };
    }

    return ModelRollupOffChain.getInstance().findOne(filter, {
      sort: { createdAt: -1 },
    });
  }
);

const zkProofStatus = publicWrapper<
  TZkProofStatusRequest,
  TZkProofStatusResponse
>(
  Joi.object({
    databaseName,
  }),
  async (_root, { databaseName }) => {
    return Transaction.mina(async (minaSession) => {
      const imRollupQueue = await ModelGenericQueue.getInstance(
        EQueueType.RollupOffChainQueue,
        minaSession
      );
      // Get latest task rollup task queue
      const task = await imRollupQueue.findOne(
        {
          databaseName,
        },
        { sort: { createdAt: -1 } }
      );

      if (!task) {
        return EQueueTaskStatus.Unknown;
      }

      return task.status;
    });
  }
);

const proverStatus = publicWrapper<TProverStatusRequest, TProverStatusResponse>(
  JOI_PROVER_STATUS,
  async (_root, { databaseName }) =>
    Transaction.mina(async (session) => {
      const imDocumentQueue = await ModelGenericQueue.getInstance(
        EQueueType.RollupOffChainQueue,
        session
      );

      const documentQueueStatus = await imDocumentQueue.databaseLatestStatus(
        databaseName,
        session
      );

      if (documentQueueStatus === EQueueTaskStatus.Failed) {
        return EQueueTaskStatus.Failed;
      }

      const imRollupOffchainQueue = await ModelGenericQueue.getInstance(
        EQueueType.RollupOffChainQueue,
        session
      );
      const rollupOffchainStatus =
        await imRollupOffchainQueue.databaseLatestStatus(databaseName, session);

      if (
        rollupOffchainStatus === EQueueTaskStatus.Queued &&
        documentQueueStatus === EQueueTaskStatus.Processing
      ) {
        return EQueueTaskStatus.Processing;
      }

      // NOTE: This assumes that the rollup offchain queue is always slower
      // than the document queue, thus we can use the latest status of the
      // rollup offchain queue as the status of the prover.
      //
      // A correct implementation needs to account for the possibility that the
      // rollup offchain queue is faster than the document queue, in which case
      // we have 5 * 4 = 20 possible states to consider, which is not worth it
      // for now.
      return rollupOffchainStatus;
    })
);

const proverRetry = authorizeWrapper<TProverRetryRequest, TProverRetryResponse>(
  JOI_PROVER_STATUS,
  async (_root, { databaseName }, ctx) =>
    Transaction.compound(async ({ sessionServerless, sessionMina }) => {
      const permission = await PermissionSecurity.database(
        { databaseName, actor: ctx.userName },
        sessionServerless
      );

      if (permission.system === false) {
        throw new Error(
          `Actor '${ctx.userName}' does not have 'system' permission which is required by this operation.`
        );
      }

      const imDocumentQueue = await ModelGenericQueue.getInstance(
        EQueueType.RollupOffChainQueue,
        sessionMina
      );

      const documentQueueStatus = await imDocumentQueue.databaseLatestStatus(
        databaseName,
        sessionMina
      );

      if (documentQueueStatus === EQueueTaskStatus.Failed) {
        return imDocumentQueue.retryLatestFailedTask(databaseName, sessionMina);
      }

      const imRollupOffchainQueue = await ModelGenericQueue.getInstance(
        EQueueType.RollupOffChainQueue,
        sessionMina
      );

      const rollupOffchainQueueStatus =
        await imRollupOffchainQueue.databaseLatestStatus(
          databaseName,
          sessionMina
        );

      if (rollupOffchainQueueStatus === EQueueTaskStatus.Failed) {
        return imRollupOffchainQueue.retryLatestFailedTask(
          databaseName,
          sessionMina
        );
      }

      return false;
    })
);

const BigIntScalar: GraphQLScalarType<bigint, string> = ScalarType.BigInt();

export const resolversProof = {
  // If we put directly BigInt: ScalarType.BigInt() you will got
  // The inferred type of cannot be named without a reference
  // We need to have a temp variable that hold the function and explicit the type
  BigInt: BigIntScalar,
  Query: {
    zkProof,
    zkProofStatus,
    proverStatus,
  },
  Mutation: {
    proverRetry,
  },
};
