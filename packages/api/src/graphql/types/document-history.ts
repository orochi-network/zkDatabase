import { TDocumentPayload } from "./document";

export type TDocumentHistoryPayload = {
  docId: string;
  documents: TDocumentPayload[];
};
