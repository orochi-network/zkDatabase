import { Document } from './document';
import { Metadata } from './metadata';

export type DocumentHistory = {
  documents: Document[];
};

export type DocumentHistoryWithMetadata = DocumentHistory & Metadata;
