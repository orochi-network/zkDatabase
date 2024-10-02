export type TPagination = {
  limit: number;
  offset: number;
};

export type TPaginationResponse<T> = {
  data: T,
  offset: number,
  totalSize: number
}