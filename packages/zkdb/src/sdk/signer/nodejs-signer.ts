import { fetchAccount, Mina, PrivateKey } from 'o1js';
import Client from 'mina-signer';
import { SignedData } from '@types';
import { MinaTransaction } from '../types/o1js';
import { Signer } from './interface/signer';
import { MinaNetwork, sendTransaction } from '@zkdb/smart-contract';
import { TransactionParams } from '../../types/transaction-params';

export class NodeSigner implements Signer {
  private privateKey: PrivateKey;
  private client: Client;
  private endpoint: string;

  constructor(privateKey: PrivateKey, endpoint: string) {
    this.privateKey = privateKey;
    this.client = new Client({ network: 'mainnet' });
    this.endpoint = endpoint;
  }

  async signAndSendTransaction(
    transaction: string,
    params: TransactionParams
  ): Promise<string> {
    const userPublicKey = this.privateKey.toPublicKey();

    const { account, error } = await fetchAccount({ publicKey: userPublicKey });

    if (error) {
      throw Error(error.statusText);
    }
    if (!account) {
      throw Error('Account has not been bound');
    }

    const nextNonce = account.nonce.toBigint();

    const signBody = {
      zkappCommand: JSON.parse(transaction),
      feePayer: {
        feePayer: userPublicKey.toBase58(),
        fee: params.fee,
        nonce: nextNonce,
        memo: params.memo ?? '',
      },
    };

    const signedLegacy = this.client.signTransaction(
      signBody,
      this.privateKey.toBase58()
    );

    const result = await sendTransaction(
      {
        zkappCommand: signedLegacy.data.zkappCommand,
        signature: signedLegacy.signature,
      },
      this.endpoint
    );

    return result.hash;
  }

  async signTransaction(
    transaction: MinaTransaction,
    otherKeys: PrivateKey[]
  ): Promise<MinaTransaction> {
    transaction.sign(otherKeys.concat(this.privateKey));
    return transaction;
  }

  async signMessage(message: string): Promise<SignedData> {
    return this.client.signMessage(message, this.privateKey.toBase58());
  }
}
