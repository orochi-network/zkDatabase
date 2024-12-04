import {
  ETransactionStatus,
  ETransactionType,
  TTransaction,
} from '@zkdb/common';
import { MinaNetwork } from '@zkdb/smart-contract';
import { ModelDatabase, ModelTransaction } from '@zkdb/storage';
import { ClientSession, ObjectId, WithId } from 'mongodb';
import { PublicKey } from 'o1js';
import { redisQueue } from '../../helper/mq.js';
import ModelUser from '../../model/global/user.js';
import { isDatabaseOwner } from './database.js';

const MINA_DECIMAL = 1e9;

export type TransactionType = 'deploy' | 'rollup';

export async function enqueueTransaction(
  databaseName: string,
  actor: string,
  transactionType: ETransactionType,
  session?: ClientSession
): Promise<ObjectId> {
  if (!(await isDatabaseOwner(databaseName, actor, session))) {
    throw Error('Only database owner can roll up the transaction');
  }

  if (transactionType === ETransactionType.Deploy) {
    const database = await ModelDatabase.getInstance().getDatabase(
      databaseName,
      { session }
    );

    if (database?.appPublicKey) {
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
      transactionType === ETransactionType.Rollup &&
      txs.some(
        (tx: WithId<TTransaction>) => tx.status === ETransactionStatus.Confirmed
      )
    ) {
      throw Error('You deploy transaction is already confirmed');
    }

    if (
      txs.some(
        (tx: WithId<TTransaction>) =>
          tx.status === ETransactionStatus.Unsigned ||
          tx.status === ETransactionStatus.Unconfirmed
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
            pendingTx._id.toString(),
            {
              status: 'success',
            },
            { session }
          );
          throw Error('You deploy transaction is already succeeded');
        } else if (onchainTx.txStatus === 'failed') {
          await modelTransaction.updateById(
            pendingTx._id.toString(),
            {
              status: 'failed',
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
  }

  const payer = await new ModelUser().findOne({ userName: actor }, { session });

  const insertResult = await modelTransaction.create(
    {
      transactionType,
      databaseName,
      status: 'start',
      createdAt: new Date(),
    },
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

export async function getTransactionForSigning(
  databaseName: string,
  actor: string,
  transactionType: ETransactionType
) {
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

        if (balance < MINA_DECIMAL * 1.1) {
          throw new Error(
            'Your account need at least 1.1 Mina to create database'
          );
        }

        return { ...readyTransaction, zkAppPublicKey: database.appPublicKey };
      } else {
        throw Error('Account has not been found in Mina Network');
      }
    }

    throw new Error('There is not any transaction for signing');
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
  id: string,
  txHash: string
) {
  if (!(await isDatabaseOwner(databaseName, actor))) {
    throw Error('Only database owner can confirm transactions');
  }
  await ModelTransaction.getInstance().updateById(id, {
    txHash,
    status: ETransactionStatus.Confirming,
  });
  return true;
}
