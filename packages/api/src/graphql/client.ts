import {
  ApolloClient,
  ApolloLink,
  HttpLink,
  InMemoryCache,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context/index.js";
import { removeTypenameFromVariables } from "@apollo/client/link/remove-typename/index.js";
import { ACCESS_TOKEN, COOKIE } from "@utils";
import { API_COLLECTION } from "./collection";
import { API_COLLECTION_INDEX } from "./collection-index";
import { API_DATABASE } from "./database";
import { API_DOCUMENT } from "./document";
import { API_GROUP } from "./group";
import { API_MERKLE } from "./merkle";
import { API_PERMISSION_OWNERSHIP } from "./permission-ownership";
import { API_PROOF } from "./proof";
import { API_ROLLUP } from "./rollup";
import { API_TRANSACTION } from "./transaction";
import { API_USER } from "./user";

export interface IApiClient<T = any> {
  api: ApiClient<T>;
  db: ReturnType<typeof API_DATABASE>;
  collection: ReturnType<typeof API_COLLECTION>;
  index: ReturnType<typeof API_COLLECTION_INDEX>;
  document: ReturnType<typeof API_DOCUMENT>;
  user: ReturnType<typeof API_USER>;
  group: ReturnType<typeof API_GROUP>;
  merkle: ReturnType<typeof API_MERKLE>;
  proof: ReturnType<typeof API_PROOF>;
  transaction: ReturnType<typeof API_TRANSACTION>;
  rollup: ReturnType<typeof API_ROLLUP>;
  permissionOwnership: ReturnType<typeof API_PERMISSION_OWNERSHIP>;
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
            storage.setItem(COOKIE, cookie);
          }
          return response;
        });
      },
    });

    const authLink = setContext(async (_, { headers }) => {
      const accessToken = this.storage.getItem(ACCESS_TOKEN);
      const cookie = this.storage.getItem(COOKIE);
      const authHeader = headers || {};
      if (cookie) {
        authHeader["cookie"] = cookie;
      }

      if (accessToken) {
        authHeader["authorization"] = `Bearer ${accessToken}`;
      }
      return {
        headers: authHeader,
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
      db: API_DATABASE(api.apollo),
      collection: API_COLLECTION(api.apollo),
      index: API_COLLECTION_INDEX(api.apollo),
      document: API_DOCUMENT(api.apollo),
      user: API_USER(api.apollo),
      group: API_GROUP(api.apollo),
      merkle: API_MERKLE(api.apollo),
      proof: API_PROOF(api.apollo),
      transaction: API_TRANSACTION(api.apollo),
      rollup: API_ROLLUP(api.apollo),
      permissionOwnership: API_PERMISSION_OWNERSHIP(api.apollo),
    };
  }
}
