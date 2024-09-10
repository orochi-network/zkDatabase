import { DocumentEncoded } from "../sdk/schema.js"
import { Metadata } from "./metadata.js"

export type Document = {
  id: string,
  documentEncoded: DocumentEncoded,
  createdAt: Date
}

export type DocumentWithMetadata = Document & Metadata