export type CollectionIndex = {
  name: string;
  size: number;
  accesses: number;
  since: Date;
  properties: 'compound' | 'unique';
};
