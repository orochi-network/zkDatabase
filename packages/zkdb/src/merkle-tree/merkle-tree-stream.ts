import { Readable, Writable } from 'stream';
import { TMerkleNodesStorage } from './merkle-tree-storage.js';
import { Encoding, Field } from 'o1js';

export type TMerkleTreeData = {
  height: number;
  nodes: TMerkleNodesStorage;
};

export class MerkleTreeReadStream extends Readable {
  private merkleTreeData: TMerkleTreeData;
  private currentIdx: number = 0;
  private batchSize: number;

  constructor(data: TMerkleTreeData, batchSize = 10) {
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
   * @returns {Buffer} - A Buffer containing the serialized node data.
   */
  public serializeNode(node: [bigint, Field]): Buffer {
    const [index, fieldElement] = node;

    const indexBuffer = Buffer.alloc(32);
    indexBuffer.writeBigInt64BE(index);

    const fieldElementBuffer = Buffer.from(
      Encoding.Bijective.Fp.toBytes(fieldElement.toFields())
    );

    const nodeData = Buffer.concat([indexBuffer, fieldElementBuffer]);

    const lengthBuffer = Buffer.alloc(2);
    lengthBuffer.writeUInt16BE(nodeData.length);

    const buffer = Buffer.concat([lengthBuffer, nodeData]);

    return buffer;
  }
}

export class MerkleTreeWriteStream extends Writable {
  private merkleTreeData: TMerkleTreeData = { height: 0, nodes: [] };
  private buffer: Buffer = Buffer.alloc(0);

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
      if (Buffer.isBuffer(chunk)) {
        this.buffer = Buffer.concat([this.buffer, chunk]);

        if (!this.isJSONParsed) {
          const possibleString = this.buffer.toString('utf8');
          let parsed;
          try {
            parsed = JSON.parse(possibleString);
          } catch {
            parsed = null;
          }
          if (parsed && typeof parsed.height === 'number') {
            this.merkleTreeData.height = parsed.height;
            this.buffer = this.buffer.subarray(possibleString.length);
            this.isJSONParsed = true;
          }
        }

        while (this.buffer.length >= 2) {
          const nodeDataLength = this.buffer.readUInt16BE(0);
          if (this.buffer.length >= 2 + nodeDataLength) {
            const nodeDataChunk = this.buffer.subarray(2, 2 + nodeDataLength);
            this.buffer = this.buffer.subarray(2 + nodeDataLength);

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
   * @param {Buffer} buffer - A Buffer containing the serialized node data.
   * @returns {Array} - An array containing a bigint and a Field element.
   */
  private deserializeNode(buffer: Buffer): [bigint, Field] {
    const indexBuffer = buffer.subarray(0, 32);
    const index = indexBuffer.readBigInt64BE();

    const fieldElementBuffer = buffer.subarray(32);

    const fieldElement = Encoding.Bijective.Fp.fromBytes(fieldElementBuffer)[0];

    return [index, fieldElement];
  }
}
