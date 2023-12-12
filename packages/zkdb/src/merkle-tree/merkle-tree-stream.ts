import { Readable, Writable } from 'stream';
import { TMerkleNodesStorage } from './merkle-tree-storage.js';
import { Encoding, Field } from 'o1js';
import { Binary } from '../utilities/binary.js';

export type TMerkleTreeData = {
  height: number;
  nodes: TMerkleNodesStorage;
};

export class MerkleTreeReadStream extends Readable {
  private merkleTreeData: TMerkleTreeData;
  private currentIdx: number = 0;
  private batchSize: number;

  constructor(data: TMerkleTreeData, batchSize: number = 10) {
    super({ objectMode: true });
    this.merkleTreeData = data;
    this.batchSize = batchSize;
  }

  _read() {
    const remaining = this.merkleTreeData.nodes.length - this.currentIdx;
    const limit = Math.min(this.batchSize, remaining);

    for (let i = 0; i < limit; i++) {
      const node = this.merkleTreeData.nodes[this.currentIdx++];
      const serializedNode = this.serializeNode(node);
      if (!this.push(serializedNode)) {
        return;
      }
    }

    if (this.currentIdx === this.merkleTreeData.nodes.length) {
      const heightJSON = JSON.stringify({ height: this.merkleTreeData.height });
      this.push(Buffer.from(heightJSON, 'utf8'));
      this.push(null);
    }
  }

  /**
   * serializeNode method takes a node consisting of a bigint and a field element,
   * and serializes them into a Buffer for streaming.
   * The serialization format is as follows:
   *   - A 2-byte length field, indicating the total length of the serialized node data.
   *   - A 32-byte buffer to hold the serialized bigint value.
   *   - The remaining bytes to hold the serialized field element value (min: 1 byte, max: 32 bytes).
   * @param {Array} node - An array containing a bigint and a Field element.
   * @returns {Uint8Array} - A Uint8Array containing the serialized node data.
   */
  public serializeNode(node: [bigint, Field]): Uint8Array {
    const [index, fieldElement] = node;

    const indexBuffer = new ArrayBuffer(32);
    const indexView = new DataView(indexBuffer);
    indexView.setBigUint64(0, index, false);

    const fieldElementBytes = Encoding.Bijective.Fp.toBytes(
      fieldElement.toFields()
    );
    const fieldElementBuffer = new Uint8Array(fieldElementBytes);

    const nodeData = new Uint8Array(
      indexBuffer.byteLength + fieldElementBuffer.byteLength
    );
    nodeData.set(new Uint8Array(indexBuffer), 0);
    nodeData.set(fieldElementBuffer, indexBuffer.byteLength);

    const lengthBuffer = new ArrayBuffer(2);
    const lengthView = new DataView(lengthBuffer);
    lengthView.setUint16(0, nodeData.byteLength, false);

    const combinedBuffer = new Uint8Array(
      lengthBuffer.byteLength + nodeData.byteLength
    );
    combinedBuffer.set(new Uint8Array(lengthBuffer), 0);
    combinedBuffer.set(nodeData, lengthBuffer.byteLength);

    return combinedBuffer;
  }
}

export class MerkleTreeWriteStream extends Writable {
  private merkleTreeData: TMerkleTreeData = { height: 0, nodes: [] };
  private bufferList: Uint8Array[] = [];
  private bufferSize: number = 0;

  constructor() {
    super({ objectMode: true });
  }

  private isJSONParsed = false;

  _write(
    chunk: any,
    encoding: string,
    callback: (_?: Error | null) => void
  ): void {
    try {
      if (chunk instanceof Uint8Array) {
        this.bufferList.push(chunk);
        this.bufferSize += chunk.length;

        let buffer = Binary.concatUint8Array(this.bufferList, this.bufferSize);

        if (!this.isJSONParsed) {
          const possibleString = new TextDecoder('utf-8').decode(buffer);
          let parsed;
          try {
            parsed = JSON.parse(possibleString);
          } catch {
            parsed = null;
          }
          if (parsed && typeof parsed.height === 'number') {
            this.merkleTreeData.height = parsed.height;
            const cutOff = new TextEncoder().encode(possibleString).length;
            buffer = buffer.subarray(cutOff);
            this.bufferList = [buffer];
            this.bufferSize = buffer.length;
            this.isJSONParsed = true;
          }
        }

        while (this.bufferSize >= 2) {
          const lengthView = new DataView(
            buffer.buffer,
            buffer.byteOffset,
            buffer.byteLength
          );
          const nodeDataLength = lengthView.getUint16(0, false);

          if (this.bufferSize >= 2 + nodeDataLength) {
            const nodeDataChunk = buffer.subarray(2, 2 + nodeDataLength);
            buffer = buffer.subarray(2 + nodeDataLength);
            this.bufferList = [buffer];
            this.bufferSize = buffer.length;

            const nodeData = this.deserializeNode(nodeDataChunk);
            this.merkleTreeData.nodes.push(nodeData);
          } else {
            break;
          }
        }
        callback();
      } else {
        callback(new Error('Invalid data type'));
      }
    } catch (error) {
      console.log('error', error);
      callback(error as any);
    }
  }

  public getMerkleTreeData(): TMerkleTreeData {
    return this.merkleTreeData;
  }

  /**
   * deserializeNode method takes a Buffer containing serialized node data,
   * and deserializes it into a node consisting of a bigint and a field element.
   * The deserialization format is as follows:
   *   - The first 32 bytes contain the serialized bigint value.
   *   - The remaining bytes contain the serialized field element value.
   * @param {Uint8Array} buffer - A Uint8Array containing the serialized node data.
   * @returns {Array} - An array containing a bigint and a Field element.
   */
  private deserializeNode(buffer: Uint8Array): [bigint, Field] {
    const indexBuffer = buffer.subarray(0, 32);
    const indexView = new DataView(
      indexBuffer.buffer,
      indexBuffer.byteOffset,
      indexBuffer.byteLength
    );
    const index = indexView.getBigInt64(0, false);

    const fieldElementBuffer = buffer.subarray(32);
    const fieldElement = Encoding.Bijective.Fp.fromBytes(fieldElementBuffer)[0];

    return [index, fieldElement];
  }
}
