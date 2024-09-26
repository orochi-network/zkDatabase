import { DocumentEncoded } from '@sdk';
import { Metadata } from './metadata';

export type Document = {
  id: string;
  documentEncoded: DocumentEncoded;
  createdAt: Date;
};

export type DocumentWithMetadata = Document & Metadata;
