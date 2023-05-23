import { base32 } from 'multiformats/bases/base32';
import { Poseidon, Encoding } from 'snarkyjs';
import { BSON } from 'bson';

/**
 * Convert hex string to Uint8Array
 * @param hexString Hex string with or without 0x prefix
 * @returns Uint8Array of the hex string
 */
function convertHexToUint8Array(hexString: string): Uint8Array {
  const hex = hexString
    .replace(/^0x/i, '')
    .padStart(hexString.length + (hexString.length % 2), '0');
  const result = new Uint8Array(hex.length >> 1);

  let j = 0;
  for (let i = 0; i < result.length; i += 1) {
    j = i << 1;
    result[i] = parseInt(hex.substring(j, j + 2), 16);
  }

  return result;
}

/**
 * Perform Poseidon hash on binary data
 * @param binaryData Binary data
 * @returns Digest of data in Uint8Array
 */
function poseidonHashBinary(binaryData: Uint8Array): Uint8Array {
  return Encoding.Bijective.Fp.toBytes([
    Poseidon.hash(Encoding.Bijective.Fp.fromBytes(binaryData)),
  ]);
}

/**
 * Convert Uint8Array to base32 string
 * @param input Uint8Array binary data
 * @returns Base32 string
 */
function toBase32(input: Uint8Array): string {
  return base32.encoder.encode(input).toString();
}

/**
 * Convert base32 string to Uint8Array
 * @param input Base32 string
 * @returns Uint8Array binary data
 */
function fromBase32(input: string): Uint8Array {
  return base32.decoder.decode(input);
}

/**
 * Perform Poseidon hash on BSON document
 * @param document BSON document
 * @returns Digest of data in Uint8Array
 */
function poseidonHashBSON(document: any): Uint8Array {
  const serializedDoc = BSON.serialize(document);
  return poseidonHashBinary(serializedDoc);
}

/**
 * Concatenate array of Uint8Array
 * @param input Array of Uint8Array
 * @param size Total size of the concatenated array
 * @returns Concatenated Uint8Array
 */
function concatUint8Array(input: Uint8Array[], size?: number): Uint8Array {
  let concatedSize = 0;
  if (typeof size === 'undefined') {
    for (let i = 0; i < input.length; i += 1) {
      concatedSize += input[i].length;
    }
  } else {
    concatedSize = size;
  }
  const newArray = new Uint8Array(concatedSize);
  let pointer = 0;
  for (let i = 0; i < input.length; i += 1) {
    newArray.set(input[i], pointer);
    pointer += input[i].length;
  }
  return newArray;
}

export const Binary = {
  toBase32,
  fromBase32,
  poseidonHashBinary,
  poseidonHashBSON,
  concatUint8Array,
  convertHexToUint8Array,
};
