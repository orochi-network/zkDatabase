export type CollectionMetadata = {
  owner: string;
  group: string;
  permission: number;
};

export type DocumentMetadata = CollectionMetadata & {
  merkleIndex: string;
};

export type WithMetadata<T> = T & { metadata: DocumentMetadata };
