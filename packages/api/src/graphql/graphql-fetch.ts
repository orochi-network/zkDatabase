import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { wrapper } from "axios-cookiejar-support";
import { CookieJar } from "tough-cookie";

const convertHeaders = (headers: HeadersInit): Record<string, string> => {
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

const isNode =
  typeof process !== "undefined" &&
  process.versions != null &&
  process.versions.node != null;

let customFetch: (
  uri: RequestInfo | URL,
  options?: RequestInit
) => Promise<Response>;

if (isNode) {
  const cookieJar = new CookieJar();

  const clientAxios = wrapper(
    axios.create({
      baseURL: "http://localhost:4000/graphql",
      withCredentials: true,
      jar: cookieJar,
    })
  );

  customFetch = async (
    uri: RequestInfo | URL,
    options?: RequestInit
  ): Promise<Response> => {
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
    const headers = convertHeaders(options?.headers || {});
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
} else {
  customFetch = async (
    uri: RequestInfo | URL,
    options?: RequestInit
  ): Promise<Response> => {
    return fetch(uri, options);
  };
}

export default customFetch;
