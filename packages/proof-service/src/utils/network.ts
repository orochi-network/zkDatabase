export type NetworkResult<T> = Success<T> | Error;

export interface Success<T> {
  type: "success";
  data: T;
}

export interface Error {
  type: "error";
  message: string | undefined;
}