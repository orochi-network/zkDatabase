import { isDatabaseOwner } from './database.js';
import { redisQueue } from '../../helper/mq.js';
import { ModelDbDeployTx, ModelDbSetting } from '@zkdb/storage';
import ModelUser from '../../model/global/user.js';
import { MinaNetwork } from '@zkdb/smart-contract';
import { PublicKey } from 'o1js';

const MINA_DECIMAL = 1e9;

export type TransactionType = 'deploy' | 'rollup';

export async function enqueueTransaction(
  databaseName: string,
  actor: string,
  transactionType: TransactionType
) {
  if (!(await isDatabaseOwner(databaseName, actor))) {
    throw Error('Only database owner can roll up the transaction');
  }

  if (transactionType === 'deploy') {
    const settings =
      await ModelDbSetting.getInstance().getSetting(databaseName);

    if (settings?.appPublicKey) {
      throw Error('Smart contract is already bound to database');
    }
  }

  const tx = await ModelDbDeployTx.getInstance().getTx(
    databaseName,
    transactionType
  );

  if (tx) {
    throw Error('You have already unprocessed transaction');
  }

  await redisQueue.enqueue(
    JSON.stringify({
      key: databaseName,
      transactionType,
      databaseName,
    })
  );
}

export async function getTransaction(
  databaseName: string,
  actor: string,
  transactionType: TransactionType
) {
  const modelUser = new ModelUser();

  const user = await modelUser.findOne({ userName: actor });

  if (!user) {
    throw Error(`User ${actor} does not exist`);
  }

  if (await isDatabaseOwner(databaseName, actor)) {
    const dbSettings =
      await ModelDbSetting.getInstance().getSetting(databaseName);

    if (!dbSettings) {
      throw Error(`Database ${databaseName} does not exist`);
    }

    const transaction = await ModelDbDeployTx.getInstance().getTx(
      databaseName,
      transactionType
    );

    if (transaction) {
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

        return transaction;
      } else {
        throw Error('Account has not been found in Mina Network');
      }
    }

    throw new Error('Cannot find transaction');
  }

  throw new Error('Only database owner can deploy database');
}
