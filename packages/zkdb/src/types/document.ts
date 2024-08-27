import { DocumentEncoded } from "../sdk/schema.js"

export type Document = {
  id: string,
  documentEncoded: DocumentEncoded,
  createdAt: Date
}