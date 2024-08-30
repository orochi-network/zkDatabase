import {
  getProof as getProofRequest,
  getProofStatus as getProofStatusRequest,
} from '@zkdb/api';
import { JsonProof } from 'o1js';
import { ProofStatus } from '../types/proof.js';
import { ProofStatus as ProofStatusPayload } from '@zkdb/api';

export async function getProof(databaseName: string): Promise<JsonProof> {
  const result = await getProofRequest(databaseName);

  if (result.type === 'success') {
    return result.data;
  } else {
    throw Error(result.message);
  }
}

export async function getProofStatus(
  databaseName: string,
  collectionName: string,
  documentId: string
): Promise<ProofStatus> {
  const result = await getProofStatusRequest(
    databaseName,
    collectionName,
    documentId
  );

  if (result.type === 'success') {
    switch (result.data) {
      case ProofStatusPayload.QUEUED:
        return 'queue';
      case ProofStatusPayload.PROVING:
        return 'proving';
      case ProofStatusPayload.PROVED:
        return 'proved';
      case ProofStatusPayload.FAILED:
        return 'failed';
    }
  } else {
    throw Error(result.message);
  }
}
