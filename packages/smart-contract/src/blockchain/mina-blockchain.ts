import { IMinaApiClient, MinaApiClient } from './graphql/client';
import { Account } from './types/account';

export class MinaBlockchain {
  #api: IMinaApiClient;

  constructor(uri: string) {
    this.#api = MinaApiClient.newInstance(uri);
  }

  async getAccount(publicKey: string): Promise<Account> {
    const result = await this.#api.account.getOne({
      publicKey,
    });

    return result.unwrap();
  }

  async isZkAppExist(publicKey: string): Promise<boolean> {
    const result = await this.#api.account.getOne({
      publicKey,
    });

    return result.unwrap().verificationKey !== null;
  }

  async isRegularAppExist(publicKey: string): Promise<boolean> {
    const result = await this.#api.account.getOne({
      publicKey,
    });

    return result.unwrap().verificationKey === null;
  }
}
