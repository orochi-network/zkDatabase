import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  ApolloLink,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context/index.js";
import { removeTypenameFromVariables } from "@apollo/client/link/remove-typename/index.js";
import { Context } from "@authentication";
import { database } from "./database";
import { collection } from "./collection";
import { collectionIndex } from "./collection-index";
import { document } from "./document";
import { user } from "./user";
import { group } from "./group";
import { ownership } from "./ownership";
import { permission } from "./permission";
import { merkle } from "./merkle";
import { proof } from "./proof";

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
}

export class ApiClient<T = any> {
  #client: InstanceType<typeof ApolloClient<any>>;

  context: Context<T> = new Context<T>();

  public setContext(fn: () => T | null) {
    this.context.setContextCallback(fn);
  }

  public getContext() {
    return this.context.getContext();
  }

  public get apollo() {
    return this.#client;
  }

  constructor(uri: string) {
    const context = new Context<T>();
    const removeTypenameLink = removeTypenameFromVariables();
    this.context = context;
    const httpLink = new HttpLink({ uri, credentials: "include" });
    const authLink = setContext(async (_, { headers }) => {
      const token = this.context.getContext();
      return token
        ? {
            headers: {
              ...headers,
              authorization: `Bearer ${token}`,
            },
          }
        : { headers };
    });
    this.#client = new ApolloClient({
      link: ApolloLink.from([removeTypenameLink, authLink, httpLink]),
      credentials: "include",
      cache: new InMemoryCache({ addTypename: false }),
    });
  }

  public static newInstance<T = any>(url: string) {
    const api = new ApiClient<T>(url);
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
    };
  }
}
