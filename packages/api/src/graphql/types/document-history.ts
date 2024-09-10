import { DocumentPayload } from "./document"

export type DocumentHistoryPayload = {
  docId: string,
  documents: DocumentPayload[]
}