import * as pkg from "@apollo/client";
import { removeTypenameFromVariables } from "@apollo/client/link/remove-typename/index.js";
import { setContext } from "@apollo/client/link/context/index.js";
import { Context } from "../authentication/context.js";
import { collection } from "./collection.js";
import { database } from "./database.js";
import { document } from "./document.js";
import { collectionIndex } from "./collection-index.js";
import { user } from "./user.js";
import { group } from "./group.js";
import { merkle } from "./merkle.js";
import { ownership } from "./ownership.js";
import { permission } from "./permission.js";
import { proof } from "./proof.js";

const { ApolloClient, InMemoryCache, HttpLink, ApolloLink } = pkg;

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
