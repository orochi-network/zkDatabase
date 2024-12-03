import { TMetadataDetailCollection } from './metadata.js';

export enum ESorting {
  // -1
  Asc,
  // 1
  Desc,
}

export enum EProperty {
  Compound,
  Unique,
}

export type TCollectionIndex = {
  name: string;
  sorting: ESorting;
};

export type TCollectionIndexInfo = {
  name: string;
  size: number;
  access: number;
  since: Date;
  property: EProperty;
};

export type TCollectionDetail = TMetadataDetailCollection<{
  name: string;
  index: TCollectionIndex[];
  sizeOnDisk: number;
}>;
