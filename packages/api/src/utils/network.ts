export type NetworkResult<T> = Success<T> | Error;

export interface Success<T> {
  type: "success";
  data: T;
}

export interface Error {
  type: "error";
  message: string | undefined;
}

export async function handleRequest<T>(
  request: () => Promise<NetworkResult<T>>
): Promise<NetworkResult<T>> {
  try {
    return request();
  } catch (error) {
    return {
      type: "error",
      message: (error as any).message ?? "An unknown error occurred",
    };
  }
}
