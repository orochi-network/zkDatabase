import {
  ETransactionStatus,
  ETransactionType,
  TDbRecord,
  TTransaction,
  TTransactionRecord,
} from '@zkdb/common';
import { MinaNetwork } from '@zkdb/smart-contract';
import { ModelDatabase, ModelTransaction } from '@zkdb/storage';
import { ClientSession, ObjectId, WithId } from 'mongodb';
import { PublicKey } from 'o1js';
import { redisQueue } from '../../helper/mq.js';
import ModelUser from '../../model/global/user.js';
import { isDatabaseOwner } from './database.js';

const MINA_DECIMAL = 1e9;

const requiredBalanceMap = new Map<ETransactionType, number>([
  [ETransactionType.Deploy, MINA_DECIMAL * 1.1],
  [ETransactionType.Rollup, MINA_DECIMAL * 0.1],
]);

export async function enqueueTransaction(
  databaseName: string,
  actor: string,
  transactionType: ETransactionType,
  session?: ClientSession
): Promise<ObjectId> {
  if (!(await isDatabaseOwner(databaseName, actor, session))) {
    throw Error('Only database owner can roll up the transaction');
  }

  // Check if smart contract is already bound to database
  if (transactionType === ETransactionType.Deploy) {
    const database = await ModelDatabase.getInstance().getDatabase(
      databaseName,
      { session }
    );

    // Make sure public is set and have value
    if (
      typeof database?.appPublicKey === 'string' &&
      database.appPublicKey.length > 0
    ) {
      throw Error('Smart contract is already bound to database');
    }
  }

  const modelTransaction = ModelTransaction.getInstance();

  const txs = await modelTransaction.getTxs(databaseName, transactionType, {
    session,
  });

  // Validate transactions
  if (txs.length > 0) {
    if (
      transactionType === ETransactionType.Deploy &&
      txs.some(
        (tx: WithId<TTransaction>) => tx.status === ETransactionStatus.Confirmed
      )
    ) {
      // @QUESTION: Do we need to update status of Transaction and also
      // deployment status of database?
      throw new Error('You deploy transaction is already confirmed');
    }

    if (
      // If we have uncompleted transaction, we should not allow to deploy new one.
      // Un-completed transaction is mean that transaction is unsigned or signed without broadcast.
      txs.some(
        (tx: WithId<TTransaction>) =>
          tx.status === ETransactionStatus.Unsigned ||
          tx.status === ETransactionStatus.Signed
      )
    ) {
      throw Error('You have uncompleted transaction');
    }

    const pendingTx = txs.find(
      (tx: WithId<TTransaction>) => tx.status === ETransactionStatus.Confirming
    );

    if (pendingTx) {
      if (pendingTx.txHash) {
        const onchainTx =
          await MinaNetwork.getInstance().getZkAppTransactionByTxHash(
            pendingTx.txHash
          );

        if (!onchainTx) {
          throw Error('Onchain transaction has not been found');
        }

        if (onchainTx.txStatus === 'applied') {
          await modelTransaction.updateById(
            pendingTx._id,
            {
              status: ETransactionStatus.Confirmed,
            },
            { session }
          );
          throw Error('You deploy transaction is already succeeded');
        } else if (onchainTx.txStatus === 'failed') {
          await modelTransaction.updateById(
            pendingTx._id,
            {
              status: ETransactionStatus.Failed,
              error: onchainTx.failures.join(' '),
            },
            { session }
          );
          // Proceed and create new transaction
        }
      } else {
        throw Error('Transaction hash has not been found');
      }
    }

    // @TODO: Recheck the logic and make sure it is correct and cover all cases.
  }

  const payer = await new ModelUser().findOne({ userName: actor }, { session });

  const insertResult = await modelTransaction.create(
    // Force type since txHash is null at this point.
    // @TODO: Add default value for createdAt and updatedAt fields.
    {
      transactionType,
      databaseName,
      status: ETransactionStatus.Unsigned,
    } as TTransactionRecord,
    { session }
  );

  await redisQueue.enqueue(
    JSON.stringify({
      id: insertResult.insertedId.toString(),
      payerAddress: payer?.publicKey,
    })
  );

  return insertResult.insertedId;
}

export async function getTransactionDraft(
  databaseName: string,
  actor: string,
  transactionType: ETransactionType
): Promise<TDbRecord<TTransaction>> {
  const modelUser = new ModelUser();

  const user = await modelUser.findOne({ userName: actor });

  if (!user) {
    throw Error(`User ${actor} does not exist`);
  }

  if (await isDatabaseOwner(databaseName, actor)) {
    const database =
      await ModelDatabase.getInstance().getDatabase(databaseName);

    if (!database) {
      throw Error(`Database ${databaseName} does not exist`);
    }

    const transactions = await ModelTransaction.getInstance().getTxs(
      databaseName,
      transactionType
    );

    const readyTransaction = transactions.find(
      (tx) => tx.status === ETransactionStatus.Unsigned
    );

    if (readyTransaction) {
      const { account, error } = await MinaNetwork.getInstance().getAccount(
        PublicKey.fromBase58(user.publicKey)
      );

      if (error) {
        throw Error(`${error.statusCode}: ${error.statusText}`);
      }

      if (account) {
        const balance = account.balance.toBigInt();

        const minBalance = BigInt(requiredBalanceMap.get(transactionType)!);

        if (balance < minBalance) {
          throw new Error(
            `Your account need at least ${minBalance} balance unit for ${transactionType}`
          );
        }

        return readyTransaction;
      } else {
        throw Error('Account has not been found in Mina Network');
      }
    }

    throw new Error('There is not any unsigned transaction');
  }

  throw new Error('Only database owner can deploy database');
}

export async function getLatestTransaction(
  databaseName: string,
  transactionType: ETransactionType
) {
  const modelTransaction = ModelTransaction.getInstance();

  const txs = await modelTransaction.getTxs(databaseName, transactionType, {
    sort: {
      createdAt: -1,
    },
  });

  return txs.length === 0 ? null : txs[0];
}

export async function confirmTransaction(
  databaseName: string,
  actor: string,
  txHash: string
) {
  if (!(await isDatabaseOwner(databaseName, actor))) {
    throw Error('Only database owner can confirm transactions');
  }
  await ModelTransaction.getInstance().updateByTxHash(txHash, {
    txHash,
    status: ETransactionStatus.Confirming,
  });
  return true;
}
