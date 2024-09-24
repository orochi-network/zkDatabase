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
import axios, { AxiosResponse } from "axios";
import { CookieJar } from "tough-cookie";
import { wrapper } from "axios-cookiejar-support";

const { ApolloClient, InMemoryCache, HttpLink, ApolloLink } = pkg;

const isNode =
  typeof process !== "undefined" &&
  process.versions != null &&
  process.versions.node != null;

export interface IApiClient<T = any> {
  api: BaseApiClient<T>;
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

export abstract class BaseApiClient<T = any> {
  #client: InstanceType<typeof ApolloClient<any>> | undefined = undefined;

  context: Context<T> = new Context<T>();

  public get apollo() {
    return this.#client;
  }

  protected setApollo(client: InstanceType<typeof ApolloClient<any>>) {
    this.#client = client;
  }

  constructor(uri: string) {
    this.buildClient(uri);
  }

  abstract buildClient(uri: string): void;

  public setContext(fn: () => T | null) {
    this.context.setContextCallback(fn);
  }

  public getContext() {
    return this.context.getContext();
  }
}

class BrowserApiClient<T = any> extends BaseApiClient<T> {
  buildClient(uri: string): void {
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
    this.setApollo(
      new ApolloClient({
        link: ApolloLink.from([removeTypenameLink, authLink, httpLink]),
        cache: new InMemoryCache({ addTypename: false }),
      })
    );
  }
}

class NodeJsApiClient<T = any> extends BaseApiClient<T> {
  buildClient(uri: string): void {
    const context = new Context<T>();
    const removeTypenameLink = removeTypenameFromVariables();
    this.context = context;
    const httpLink = new HttpLink({
      uri,
      fetch: (url: RequestInfo | URL, options?: RequestInit) =>
        this.customFetch(uri, url, options),
    });
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
    this.setApollo(
      new ApolloClient({
        link: ApolloLink.from([removeTypenameLink, authLink, httpLink]),
        cache: new InMemoryCache({ addTypename: false }),
      })
    );
  }

  private convertHeaders = (headers: HeadersInit): Record<string, string> => {
    if (headers instanceof Headers) {
      const result: Record<string, string> = {};
      headers.forEach((value, key) => {
        result[key] = value;
      });
      return result;
    } else if (Array.isArray(headers)) {
      return Object.fromEntries(headers);
    } else {
      return headers as Record<string, string>;
    }
  };

  private customFetch = async (
    baseURL: string,
    uri: RequestInfo | URL,
    options?: RequestInit
  ): Promise<Response> => {
    const cookieJar = new CookieJar();

    const clientAxios = wrapper(
      axios.create({
        baseURL,
        withCredentials: true,
        jar: cookieJar,
      })
    );

    let url: string;

    if (typeof uri === "string") {
      url = uri;
    } else if (uri instanceof URL) {
      url = uri.toString();
    } else if ("url" in uri && typeof uri.url === "string") {
      url = uri.url;
    } else {
      throw new Error("Unsupported RequestInfo type");
    }

    const method = options?.method || "GET";
    const headers = this.convertHeaders(options?.headers || {});
    let data: any = undefined;

    if (options?.body) {
      try {
        data = JSON.parse(options.body.toString());
      } catch (error) {
        data = options.body;
      }
    }

    try {
      const response: AxiosResponse = await clientAxios({
        url,
        method,
        headers,
        data,
      });

      const res = new Response(JSON.stringify(response.data), {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers as any,
      });

      return res;
    } catch (error: any) {
      if (error.response) {
        const res = new Response(JSON.stringify(error.response.data), {
          status: error.response.status,
          statusText: error.response.statusText,
          headers: new Headers(error.response.headers),
        });
        return res;
      } else {
        throw error;
      }
    }
  };
}

export class ApiClient {
  public static newInstance<T = any>(url: string): IApiClient<T> {
    const api: BaseApiClient<T> = isNode
      ? new NodeJsApiClient(url)
      : new BrowserApiClient(url);

    if (api.apollo) {
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

    throw Error("Apollo Client is not initialized");
  }
}
