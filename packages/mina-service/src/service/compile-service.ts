import { ZkCompile } from '@domain';
import { config, QueueWorker } from '@helper';
import { EncryptionKey } from '@orochi-network/vault';
import {
  ETransactionStatus,
  ETransactionType,
  TTransactionQueue,
} from '@zkdb/common';
import {
  DatabaseEngine,
  ModelMetadataDatabase,
  ModelProof,
  ModelSecureStorage,
  ModelTransaction,
  withCompoundTransaction,
  ZKDB_TRANSACTION_QUEUE,
} from '@zkdb/storage';
import { Job } from 'bullmq';
import { ObjectId } from 'mongodb';
import { PrivateKey } from 'o1js';

export const SERVICE_COMPILE = {
  clusterName: 'compile',
  payload: async () => {
    // Init zkAppCompiler
    const zkAppCompiler = new ZkCompile({
      networkId: config.NETWORK_ID,
      mina: config.MINA_URL,
    });

    // Connect to db
    const serverlessDb = DatabaseEngine.getInstance(config.MONGODB_URL);
    const proofDb = DatabaseEngine.getInstance(config.PROOF_MONGODB_URL);

    if (!serverlessDb.isConnected()) {
      await serverlessDb.connect();
    }

    if (!proofDb.isConnected()) {
      await proofDb.connect();
    }

    const transactionWorker = new QueueWorker(ZKDB_TRANSACTION_QUEUE, {
      connection: { url: config.REDIS_URL },
    });

    transactionWorker.start(async (job: Job<TTransactionQueue>) =>
      withCompoundTransaction(
        async ({ serverless: session, proofService: proofSession }) => {
          // Init model transaction to update status
          const imTransaction = ModelTransaction.getInstance();
          // Init model secure storage to store encrypted privatekey or get privatekey to rollup
          const imSecureStorage = ModelSecureStorage.getInstance();

          const { transactionObjectId, payerAddress } = job.data;

          if (!payerAddress) {
            throw new Error(
              `Payer not found with transaction ${transactionObjectId}`
            );
          }

          const transaction = await imTransaction.findOne(
            {
              _id: new ObjectId(transactionObjectId),
            },
            { session }
          );

          if (!transaction) {
            throw new Error('Can not found transaction');
          }

          const { transactionType, databaseName } = transaction;

          const imMetadataDatabase = ModelMetadataDatabase.getInstance();

          const metadataDatabase = await imMetadataDatabase.findOne(
            {
              databaseName,
            },
            {
              session,
            }
          );

          if (!metadataDatabase) {
            throw new Error('Metadata database not found');
          }

          // We need to use if..else-if..else to sure type MUST be Deploy/Rollup
          if (transactionType === ETransactionType.Deploy) {
            const zkAppPrivateKey = PrivateKey.random();

            const encryptedZkAppPrivateKey = EncryptionKey.encrypt(
              Buffer.from(zkAppPrivateKey.toBase58(), 'utf-8'),
              Buffer.from(config.SERVICE_SECRET, 'base64')
            ).toString('base64');

            const transactionRaw = await zkAppCompiler.getDeployRawTx(
              payerAddress,
              zkAppPrivateKey,
              metadataDatabase.merkleHeight
            );

            // Update transaction status and add transaction raw
            await imTransaction.updateOne(
              {
                _id: transactionObjectId,
                databaseName,
                transactionType: ETransactionType.Deploy,
              },
              {
                $set: {
                  status: ETransactionStatus.Unconfirmed,
                  transactionRaw,
                  updatedAt: new Date(),
                },
              },
              { session }
            );
            // Update publicKey for database metadata
            await imMetadataDatabase.updateOne(
              { databaseName },
              {
                $set: {
                  appPublicKey: zkAppPrivateKey.toPublicKey().toBase58(),
                },
              },
              { session }
            );
            // Upsert to database when we have private key
            await imSecureStorage.updateOne(
              {
                databaseName,
              },
              {
                $set: {
                  privateKey: encryptedZkAppPrivateKey,
                  databaseName,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                },
              },
              { upsert: true, session: proofSession }
            );
          } else if (transactionType === ETransactionType.Rollup) {
            const privateKey = await imSecureStorage.findOne(
              {
                databaseName,
              },
              {
                session: proofSession,
              }
            );

            if (!privateKey) {
              throw Error('Private key has not been found');
            }
            // storing encryptedData:
            const decryptedPrivateKey = EncryptionKey.decrypt(
              Buffer.from(privateKey.privateKey, 'base64'),
              Buffer.from(config.SERVICE_SECRET, 'base64')
            ).toString();

            const zkAppPrivateKey = PrivateKey.fromBase58(decryptedPrivateKey);

            const proof = await ModelProof.getInstance().findOne(
              { databaseName },
              {
                session: proofSession,
                sort: {
                  createdAt: -1,
                },
              }
            );

            if (!proof) {
              throw new Error(`Proof for ${databaseName} not found`);
            }

            const transactionRaw = await zkAppCompiler.getRollupRawTx(
              payerAddress,
              zkAppPrivateKey,
              metadataDatabase.merkleHeight,
              proof
            );

            // Update transaction status and add transaction raw
            await imTransaction.updateOne(
              {
                _id: transactionObjectId,
                databaseName,
                transactionType: ETransactionType.Rollup,
              },
              {
                $set: {
                  status: ETransactionStatus.Unconfirmed,
                  transactionRaw,
                  updatedAt: new Date(),
                },
              },
              {
                session,
              }
            );
          } else {
            throw new Error('Unsupported transaction');
          }
        }
      )
    );
  },
};
