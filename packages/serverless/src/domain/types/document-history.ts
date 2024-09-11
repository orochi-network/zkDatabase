import { Document } from "./document.js"

export type HistoryDocument = {
  docId: string,
  documents: Document[],
  deleted: boolean
}