import { fetchAccount, Mina, NetworkId, PublicKey } from 'o1js';
import {
  BlockberryApi,
  TBlockConfirmationTransaction,
  TZkAppTransaction,
} from './api.js';

export class MinaNetwork {
  private static instance: MinaNetwork;
  private isConnected: boolean;
  #api: BlockberryApi;

  private constructor() {}

  public get connected() {
    return this.isConnected;
  }

  public static getInstance(): MinaNetwork {
    if (!this.instance) {
      this.instance = new MinaNetwork();
    }

    return this.instance;
  }

  public connect(networkId: NetworkId, endpoint: string, apiKey: string) {
    Mina.setActiveInstance(
      Mina.Network({
        networkId,
        mina: endpoint,
      })
    );

    this.#api = new BlockberryApi(
      apiKey,
      networkId === 'mainnet' ? 'mainnet' : 'devnet'
    );

    this.isConnected = true;
  }

  public async getAccount(publicKey: PublicKey) {
    this.ensureConnection();

    return fetchAccount({
      publicKey,
    });
  }

  public async getBlockConfirmationByTransactionHash(
    txHash: string
  ): Promise<TBlockConfirmationTransaction | undefined> {
    return this.#api.getBlockConfirmationByTransactionHash(txHash);
  }

  public async getZkAppTransactionByTxHash(
    txHash: string
  ): Promise<TZkAppTransaction | undefined> {
    return this.#api.getZkAppTransactionByTxHash(txHash);
  }

  private ensureConnection() {
    if (!this.isConnected) {
      throw Error('Please connect to mina network first');
    }
  }
}
