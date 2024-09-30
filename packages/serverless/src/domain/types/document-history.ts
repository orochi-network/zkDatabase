import { Document } from './document';

export type HistoryDocument = {
  docId: string;
  documents: Document[];
  deleted: boolean;
};
