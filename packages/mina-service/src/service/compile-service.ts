import { ZkCompile } from '@domain';
import { config, logger, QueueWorker } from '@helper';
import { EncryptionKey } from '@orochi-network/vault';
import {
  ETransactionStatus,
  ETransactionType,
  MinaNetwork,
  TTransactionQueue,
} from '@zkdb/common';
import {
  DatabaseEngine,
  ModelMetadataDatabase,
  ModelRollupOffChain,
  ModelSecureStorage,
  ModelTransaction,
  TCompoundSession,
  Transaction,
  ZKDB_TRANSACTION_QUEUE,
} from '@zkdb/storage';
import { Job } from 'bullmq';
import { ObjectId } from 'mongodb';
import { PrivateKey, PublicKey } from 'o1js';

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
      Transaction.compound(async (compoundSession: TCompoundSession) => {
        const { sessionServerless, sessionMina } = compoundSession;

        // Init model transaction to update status
        const imTransaction = ModelTransaction.getInstance();
        // Init model secure storage to store encrypted privatekey or get privatekey to rollup
        const imSecureStorage = ModelSecureStorage.getInstance();

        const {
          transactionObjectId,
          payerAddress,
          databaseName,
          transactionType,
        } = job.data;

        if (!payerAddress) {
          throw new Error(
            `Payer not found with transaction ${transactionObjectId}`
          );
        }

        const imMetadataDatabase = ModelMetadataDatabase.getInstance();

        const metadataDatabase = await imMetadataDatabase.findOne(
          {
            databaseName,
          },
          {
            session: sessionServerless,
          }
        );

        if (!metadataDatabase) {
          throw new Error('Metadata database not found');
        }

        await zkAppCompiler.verificationKeySet(
          metadataDatabase.merkleHeight,
          sessionMina
        );

        const mina = MinaNetwork.getInstance();
        mina.connect(
          config.NETWORK_ID,
          config.MINA_URL,
          config.BLOCKBERRY_API_KEY
        );

        const { error, account } = await mina.getAccount(
          PublicKey.fromBase58(payerAddress)
        );

        if (!account || error) {
          logger.error(error);
          return;
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
              _id: new ObjectId(transactionObjectId),
              databaseName,
              transactionType: ETransactionType.Deploy,
            },
            {
              $set: {
                status: ETransactionStatus.Unsigned,
                transactionRaw,
                updatedAt: new Date(),
                createdAt: new Date(),
              },
            },
            { session: sessionServerless, upsert: true }
          );
          // Update publicKey for database metadata
          await imMetadataDatabase.updateOne(
            { databaseName },
            {
              $set: {
                appPublicKey: zkAppPrivateKey.toPublicKey().toBase58(),
                // @TODO: add EDeployStatus Undeploy, Deploying, Deployed, Fail
                deployStatus: ETransactionStatus.Unsigned,
              },
            },
            { session: sessionServerless }
          );

          // Upsert to database when we have private key
          await imSecureStorage.updateOne(
            {
              databaseName,
            },
            {
              $set: {
                privateKey: encryptedZkAppPrivateKey,
                publicKey: zkAppPrivateKey.toPublicKey().toBase58(),
                databaseName,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            },
            { upsert: true, session: sessionMina }
          );
        } else if (transactionType === ETransactionType.Rollup) {
          const privateKey = await imSecureStorage.findOne(
            {
              databaseName,
            },
            {
              session: sessionMina,
            }
          );

          if (!privateKey) {
            throw new Error(
              `Private key of database ${databaseName} has not been found`
            );
          }
          // storing encryptedData:
          const decryptedPrivateKey = EncryptionKey.decrypt(
            Buffer.from(privateKey.privateKey, 'base64'),
            Buffer.from(config.SERVICE_SECRET, 'base64')
          ).toString();

          const zkAppPrivateKey = PrivateKey.fromBase58(decryptedPrivateKey);

          if (
            zkAppPrivateKey.toPublicKey().toBase58() !==
            metadataDatabase.appPublicKey
          ) {
            throw new Error('Mismatch between privateKey and publicKey');
          }

          const proofOffChain = await ModelRollupOffChain.getInstance().findOne(
            { databaseName },
            {
              session: sessionMina,
              sort: {
                createdAt: -1,
              },
            }
          );

          if (!proofOffChain) {
            throw new Error(`Proof for ${databaseName} not found`);
          }

          const transactionRaw = await zkAppCompiler.getRollupRawTx(
            payerAddress,
            zkAppPrivateKey,
            metadataDatabase.merkleHeight,
            proofOffChain.proof
          );

          // Update transaction status and add transaction raw
          await imTransaction.updateOne(
            {
              _id: new ObjectId(transactionObjectId),
              databaseName,
              transactionType: ETransactionType.Rollup,
            },
            {
              $set: {
                status: ETransactionStatus.Unsigned,
                transactionRaw,
                updatedAt: new Date(),
                createdAt: new Date(),
              },
            },
            {
              session: sessionServerless,
              upsert: true,
            }
          );
        } else {
          // Show what transaction type that unsupported and not suppose to be
          throw new Error(`Unsupported transaction ${transactionType}`);
        }
      })
    );
  },
};

export default SERVICE_COMPILE;
