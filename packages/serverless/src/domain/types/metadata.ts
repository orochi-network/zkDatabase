export type CollectionMetadata = {
  userName: string;
  groupName: string;
  permission: number;
};

export type DocumentMetadata = CollectionMetadata & {
  merkleIndex: string;
};

export type WithMetadata<T> = T & { metadata: DocumentMetadata };
