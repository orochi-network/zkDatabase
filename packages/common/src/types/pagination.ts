export type TPagination = {
  limit: number;
  offset: number;
};

export type TPaginationReturn<T> = {
  data: T;
  total: number;
  offset: number;
};
