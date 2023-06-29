import { CID } from 'multiformats';

/**
 * Convert string to CID
 * @param strCID CID in string
 * @returns CID
 * @throws Error if invalid CID format
 */
function toCID(strCID: string): CID {
  const cid = CID.parse(strCID);
  if (cid) {
    return cid;
  }
  throw new Error('Invalid CID format');
}

export const Helper = {
  toCID,
};
