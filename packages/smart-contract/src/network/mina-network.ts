import { fetchAccount, Mina, NetworkId, PublicKey } from 'o1js';

export class MinaNetwork {
  private static instance: MinaNetwork;
  private isConnected: boolean;

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

  public connect(networkId: NetworkId, endpoint: string) {
    Mina.setActiveInstance(
      Mina.Network({
        networkId,
        mina: endpoint,
      })
    );

    this.isConnected = true;
  }

  public async getAccount(publicKey: PublicKey) {
    this.ensureConnection();

    return fetchAccount({
      publicKey,
    });
  }

  private ensureConnection() {
    if (!this.isConnected) {
      throw Error('Please connect to mina network first');
    }
  }
}
