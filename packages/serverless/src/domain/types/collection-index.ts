import { Sorting } from "./sorting.js";

export type CollectionIndex = {
  name: string,
  sorting: Sorting
}

export type CollectionIndexInfo = {
  name: string;
  size: number;
  accesses: number;
  since: Date;
  properties: 'compound' | 'unique';
};
