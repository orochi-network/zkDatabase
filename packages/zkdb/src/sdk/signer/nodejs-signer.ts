import { SignedData } from '@types';
import { sendTransaction } from '@zkdb/smart-contract';
import Client from 'mina-signer';
import { fetchAccount, NetworkId, PrivateKey } from 'o1js';
import { TransactionParams } from '../../types/transaction-params';
import { MinaTransaction } from '../types/o1js';

export class NodeSigner {
  private static instance: NodeSigner;
  private client: Client;
  private endpoint: string;

  public static getInstance(networkId: NetworkId) {
    if (!NodeSigner.instance) {
      NodeSigner.instance = new NodeSigner(networkId);
    }

    return NodeSigner.instance;
  }

  constructor(network: NetworkId) {
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
    params: TransactionParams,
    privateKey: PrivateKey
  ): Promise<string> {
    const publicKey = privateKey.toPublicKey();

    const { account, error } = await fetchAccount({ publicKey });

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
        feePayer: publicKey.toBase58(),
        fee: params.fee,
        nonce: nextNonce,
        memo: params.memo ?? '',
      },
    };

    const signedLegacy = this.client.signTransaction(
      signBody,
      privateKey.toBase58()
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
    privateKey: PrivateKey
  ): Promise<MinaTransaction> {
    transaction.sign([privateKey]);
    return transaction;
  }

  async signMessage(
    message: string,
    privateKey: PrivateKey
  ): Promise<SignedData> {
    return this.client.signMessage(message, privateKey.toBase58());
  }
}
