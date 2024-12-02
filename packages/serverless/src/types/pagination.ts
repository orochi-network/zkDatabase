export type TPagination = {
  limit: number;
  offset: number;
};

export type TPaginationReturn<T> = {
  data: T;
  totalSize: number;
  offset: number;
};
