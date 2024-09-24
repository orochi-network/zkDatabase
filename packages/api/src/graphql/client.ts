import * as pkg from "@apollo/client";
import * as jose from "jose";
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

const { ApolloClient, InMemoryCache, HttpLink, ApolloLink } = pkg;

export class ApiClient<T extends jose.JWTPayload> {
  #client: InstanceType<typeof ApolloClient<any>>;

  context: Context<T> = new Context<T>();

  public get client() {
    return this.#client;
  }

  constructor(uri: string) {
    const context = new Context<T>();
    const removeTypenameLink = removeTypenameFromVariables();
    this.context = context;
    const httpLink = new HttpLink({ uri });
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

  public static newInstance<T extends jose.JWTPayload>(url: string) {
    const api = new ApiClient<T>(url);
    return {
      api,
      db: database(api.client),
      collection: collection(api.client),
      index: collectionIndex(api.client),
      doc: document(api.client),
      user: user(api.client),
      group: group(api.client),
      ownership: ownership(api.client),
      permission: permission(api.client),
      merkle: merkle(api.client),
    };
  }
}
