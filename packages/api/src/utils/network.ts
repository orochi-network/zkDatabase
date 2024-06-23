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
  request: () => Promise<{ data: T }>
): Promise<NetworkResult<T>> {
  try {
    const { data } = await request();
    return { type: "success", data };
  } catch (error) {
    return {
      type: "error",
      message: (error as any).message ?? "An unknown error occurred",
    };
  }
}
