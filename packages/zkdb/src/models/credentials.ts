import { PrivateKey, PublicKey } from 'o1js';

export class Credentials {
  private feePayerKey: PrivateKey;
  private zkAppKey: PrivateKey;

  constructor(feePayerKey: PrivateKey, zkAppKey: PrivateKey) {
    this.feePayerKey = feePayerKey;
    this.zkAppKey = zkAppKey;
  }

  public getZkAppKey(): PrivateKey {
    return this.zkAppKey;
  }

  public getFeePayerKey(): PrivateKey {
    return this.feePayerKey;
  }

  public getZkApp(): PublicKey {
    return this.zkAppKey.toPublicKey();
  }

  public getFeePayer(): PublicKey {
    return this.feePayerKey.toPublicKey();
  }
}
