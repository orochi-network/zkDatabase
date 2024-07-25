import { AuroWallet } from '../wallet/auro-wallet.js';
import { BaseAuthenticator } from './zkdb-authentication.js';

export class BrowserAuthenticator extends BaseAuthenticator {

  private static INSTANCE: BrowserAuthenticator;

  public static getInstance(): BrowserAuthenticator {
    if (!this.INSTANCE) {
      this.INSTANCE = new BrowserAuthenticator();
    }

    return this.INSTANCE;
  }


  private constructor() {
    super();
  }

  async login(email: string): Promise<void> {
    const signInProof = await AuroWallet.signMessage(
      JSON.stringify({
        email,
        timestamp: Math.floor(Date.now() / 1000),
      })
    );

    await super.sendLoginRequest(email, signInProof);
  }

  async register(userName: string, userEmail: string): Promise<void> {
    const signUpProof = await AuroWallet.signMessage(
      JSON.stringify({
        userName,
        email: userEmail,
      })
    );

    await super.sendRegistrationRequest(userEmail, userName, signUpProof);
  }
}
