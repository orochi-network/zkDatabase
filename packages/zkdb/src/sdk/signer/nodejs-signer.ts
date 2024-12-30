import { sendTransaction } from '@zkdb/smart-contract';
import Client from 'mina-signer';
import { fetchAccount, NetworkId, PrivateKey, Transaction } from 'o1js';
import { SignedLegacy } from 'o1js/dist/node/mina-signer/src/types';
import { Signer, TransactionParams } from './interface/signer';

export class NodeSigner implements Signer {
  private privateKey: PrivateKey;
  private client: Client;
  private endpoint: string;

  constructor(privateKey: PrivateKey, network: NetworkId) {
    this.privateKey = privateKey;
    if (network === 'testnet') {
      this.client = new Client({ network: 'testnet' });
      this.endpoint = 'https://api.minascan.io/node/devnet/v1/graphql';
    } else if (network === 'mainnet') {
      this.client = new Client({ network: 'mainnet' });
      this.endpoint = 'https://api.minascan.io/node/mainnet/v1/graphql';
    } else {
      throw Error('Invalid network');
    }
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
    transaction: Transaction<false, false>,
    otherKeys: PrivateKey[]
  ): Promise<Transaction<false, true>> {
    transaction.sign(otherKeys.concat(this.privateKey));
    return transaction;
  }

  async signMessage(message: string): Promise<SignedLegacy<string>> {
    return this.client.signMessage(message, this.privateKey.toBase58());
  }
}
