import { Document } from "./document.js"
import { Metadata } from "./metadata.js"

export type DocumentHistory = {
  documents: Document[]
}

export type DocumentHistoryWithMetadata = DocumentHistory & Metadata