import { BSON } from 'bson';
import { Poseidon, Encoding, Field } from 'o1js';

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
 * Convert field to binary
 * @param field Field
 * @returns Uint8Array binary data
 */
function fieldToBinary(field: Field): Uint8Array {
  return Encoding.Bijective.Fp.toBytes([field]);
}

/**
 * Convert binary to field
 * @param binary Uint8Array binary data
 * @returns Array of field
 */
function binaryToField(binary: Uint8Array): Field {
  const result = Encoding.Bijective.Fp.fromBytes(binary);
  if (result.length === 1) {
    return result[0];
  }
  console.log(result);
  throw new Error('Invalid binary data');
}

function ecnodeFields(fields: Field[]) {
  return BSON.serialize({ root: fields.map((e) => e.toString()) });
}

function decodeFields(data: Uint8Array): Field[] {
  return BSON.deserialize(data).root.map((e: string) => Field(e));
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
  poseidonHashBinary,
  concatUint8Array,
  convertHexToUint8Array,
  ecnodeFields,
  decodeFields,
  fieldToBinary,
  binaryToField,
};
