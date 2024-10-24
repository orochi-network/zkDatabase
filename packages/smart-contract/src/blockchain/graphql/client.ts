import { ApolloClient } from "@apollo/client/core/core.cjs";
import { HttpLink } from '@apollo/client/link/http/http.cjs';
import { ApolloLink } from '@apollo/client/link/core/core.cjs';
import { InMemoryCache } from '@apollo/client/cache/cache.cjs';

import { accounts } from './account';

export interface IMinaApiClient<T = any> {
  api: MinaApiClient<T>;
  account: ReturnType<typeof accounts>;
}

export class MinaApiClient<T = any> {
  #client: InstanceType<typeof ApolloClient<any>>;

  public get apollo() {
    return this.#client;
  }

  constructor(uri: string) {
    const httpLink = new HttpLink({
      uri,
    });

    this.#client = new ApolloClient({
      link: ApolloLink.from([httpLink]),
      cache: new InMemoryCache({ addTypename: false }),
    });
  }

  public static newInstance<T = any>(url: string): IMinaApiClient<T> {
    const api = new MinaApiClient<T>(url);
    return {
      api,
      account: accounts(api.apollo),
    };
  }
}
