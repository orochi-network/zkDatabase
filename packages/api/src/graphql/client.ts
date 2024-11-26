import {
  ApolloClient,
  ApolloLink,
  HttpLink,
  InMemoryCache,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context/index.js";
import { removeTypenameFromVariables } from "@apollo/client/link/remove-typename/index.js";
import { ACCESS_TOKEN, COOKIE } from "@utils";
import { collection } from "./collection";
import { collectionIndex } from "./collection-index";
import { database } from "./database";
import { document } from "./document";
import { environment } from "./environment";
import { group } from "./group";
import { merkle } from "./merkle";
import { ownership } from "./ownership";
import { permission } from "./permission";
import { proof } from "./proof";
import { rollup } from "./rollup";
import { transaction } from "./transaction";
import { user } from "./user";

export interface IApiClient<T = any> {
  api: ApiClient<T>;
  db: ReturnType<typeof database>;
  collection: ReturnType<typeof collection>;
  index: ReturnType<typeof collectionIndex>;
  doc: ReturnType<typeof document>;
  user: ReturnType<typeof user>;
  group: ReturnType<typeof group>;
  ownership: ReturnType<typeof ownership>;
  permission: ReturnType<typeof permission>;
  merkle: ReturnType<typeof merkle>;
  proof: ReturnType<typeof proof>;
  transaction: ReturnType<typeof transaction>;
  rollup: ReturnType<typeof rollup>;
  environment: ReturnType<typeof environment>;
}

export class ApiClient<T = any> {
  #client: InstanceType<typeof ApolloClient<any>>;

  public get apollo() {
    return this.#client;
  }

  constructor(
    uri: string,
    private readonly storage: Storage
  ) {
    const removeTypenameLink = removeTypenameFromVariables();
    const httpLink = new HttpLink({
      uri,
      credentials: "include",
      fetch: async (
        uri: string | URL | globalThis.Request,
        options?: RequestInit
      ) => {
        return fetch(uri, {
          ...options,
          credentials: "include", // This ensures cookies are sent with the request
        }).then((response: Response) => {
          const cookie = response.headers.get("set-cookie");
          if (cookie) {
            // Set cookies to store connect.sid
            storage.setItem("cookie", cookie);
          }
          return response;
        });
      },
    });

    const authLink = setContext(async (_, { headers }) => {
      const accessToken = this.storage.getItem(ACCESS_TOKEN);
      const cookie = this.storage.getItem(COOKIE);
      return {
        headers: {
          ...headers,
          ...(cookie ? { cookie } : {}),
          ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
        },
      };
    });

    this.#client = new ApolloClient({
      link: ApolloLink.from([removeTypenameLink, authLink, httpLink]),
      cache: new InMemoryCache({ addTypename: false }),
      defaultOptions: {
        watchQuery: {
          fetchPolicy: "no-cache",
        },
        query: {
          fetchPolicy: "no-cache",
        },
        mutate: {
          fetchPolicy: "no-cache",
        },
      },
    });
  }
  public static newInstance<T = any>(
    url: string,
    storage: Storage
  ): IApiClient<T> {
    const api = new ApiClient<T>(url, storage);
    return {
      api,
      db: database(api.apollo),
      collection: collection(api.apollo),
      index: collectionIndex(api.apollo),
      doc: document(api.apollo),
      user: user(api.apollo),
      group: group(api.apollo),
      ownership: ownership(api.apollo),
      permission: permission(api.apollo),
      merkle: merkle(api.apollo),
      proof: proof(api.apollo),
      transaction: transaction(api.apollo),
      rollup: rollup(api.apollo),
      environment: environment(api.apollo),
    };
  }
}
