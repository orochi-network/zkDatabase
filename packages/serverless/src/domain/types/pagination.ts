export type Pagination = {
  limit: number;
  offset: number;
};

export type PaginationReturn<T> = {
  data: T;
  totalSize: number;
  offset: number;
};
