import { MinaTransaction } from '@types';
import { Field, Mina } from 'o1js';

export function serializeTransaction(tx: MinaTransaction): string {
  const length = tx.transaction.accountUpdates.length;
  let i: number;
  let blindingValues: string[] = [];
  for (i = 0; i < length; i++) {
    const la = tx.transaction.accountUpdates[i].lazyAuthorization;
    if (
      la !== undefined &&
      (la as any).blindingValue !== undefined &&
      (la as any).kind === 'lazy-proof'
    ) {
      blindingValues.push(((la as any).blindingValue as Field).toJSON());
    } else {
      blindingValues.push('');
    }
  }

  const serializedTransaction: string = JSON.stringify(
    {
      tx: tx.toJSON(),
      blindingValues,
      length,
      fee: tx.transaction.feePayer.body.fee.toJSON(),
      sender: tx.transaction.feePayer.body.publicKey.toBase58(),
      nonce: tx.transaction.feePayer.body.nonce.toBigint().toString(),
    },
    null,
    2
  );
  return serializedTransaction;
}

export function deserializeTransaction(
  serializedTransaction: string
): MinaTransaction {
  const { tx, blindingValues, length } = JSON.parse(serializedTransaction);

  const transaction = Mina.Transaction.fromJSON(
    JSON.parse(tx)
  ) as MinaTransaction;
  if (length !== transaction.transaction.accountUpdates.length) {
    throw new Error('Serialized Transaction length mismatch');
  }
  for (let i = 0; i < length; i++) {
    if (blindingValues[i] !== '') {
      (
        transaction.transaction.accountUpdates[i].lazyAuthorization as any
      ).blindingValue = Field.fromJSON(blindingValues[i]);
    }
  }
  return transaction;
}
