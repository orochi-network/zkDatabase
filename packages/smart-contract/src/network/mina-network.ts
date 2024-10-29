import { fetchAccount, Mina, NetworkId, PublicKey } from 'o1js';

export class MinaNetwork {
  private static INSTANCE: MinaNetwork;
  private isConnected: boolean;

  private constructor() {}

  public get connected() {
    return this.isConnected;
  }

  public static getInstance(): MinaNetwork {
    if (!this.INSTANCE) {
      this.INSTANCE = new MinaNetwork();
    }

    return this.INSTANCE;
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

  public async getAccount(pk: PublicKey) {
    this.ensureConnection();

    return fetchAccount({
      publicKey: pk
    });
  }

  private ensureConnection() {
    if (!this.isConnected) {
      throw Error('Please connect to mina network first')
    }
  }
}
