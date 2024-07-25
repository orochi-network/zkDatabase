import { BaseAuthenticator } from './zkdb-authentication.js';
import Client from 'mina-signer';

export class NodeAuthenticator extends BaseAuthenticator {
  private client: Client;
  private static INSTANCE: NodeAuthenticator;

  public static getInstance(): NodeAuthenticator {
    if (!this.INSTANCE) {
      this.INSTANCE = new NodeAuthenticator();
    }

    return this.INSTANCE;
  }

  private constructor() {
    super();
    this.client = new Client({ network: 'testnet' });
  }

  async login(email: string, privateKey: string): Promise<void> {
    console.log(
      JSON.stringify({
        email,
        timestamp: Math.floor(Date.now() / 1000),
      })
    );
    const signInProof = this.client.signMessage(
      JSON.stringify({
        email,
        timestamp: Math.floor(Date.now() / 1000),
      }),
      privateKey
    );

    await super.sendLoginRequest(email, signInProof);
  }

  async register(
    userName: string,
    userEmail: string,
    privateKey: string
  ): Promise<void> {
    const signUpProof = this.client.signMessage(
      JSON.stringify({
        userName,
        email: userEmail,
      }),
      privateKey
    );

    await super.sendRegistrationRequest(userEmail, userName, signUpProof);
  }
}
