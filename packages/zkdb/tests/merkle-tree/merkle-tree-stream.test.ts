import {
  MerkleTreeReadStream,
  MerkleTreeWriteStream,
  TMerkleTreeData,
} from '../../src/merkle-tree/merkle-tree-stream.js';
import { Field, Poseidon } from 'o1js';

describe('MerkleTreeStream', () => {
  const sampleData: TMerkleTreeData = {
    height: 5,
    nodes: [
      [BigInt(1), Field(1)],
      [BigInt(2), Field(2)],
      [BigInt(3), Poseidon.hash(Field(3).toFields())],
      [BigInt(4), Poseidon.hash(Field(4).toFields())],
    ],
  };

  describe('MerkleTreeReadStream', () => {
    it('should read nodes correctly', (done) => {
      const readStream = new MerkleTreeReadStream(sampleData);

      const receivedBuffers: Buffer[] = [];

      readStream.on('data', (chunk) => {
        if (Buffer.isBuffer(chunk)) {
          try {
            const parsed = JSON.parse(chunk.toString('utf8'));
            if (parsed && typeof parsed.height === 'number') {
              chunk = Buffer.from(
                JSON.stringify({ height: parsed.height }),
                'utf8'
              );
            }
          } catch (error) {
            console.log('Error:', error);
          }
        }
        receivedBuffers.push(chunk);
      });

      readStream.on('end', () => {
        try {
          const expectedBuffers = sampleData.nodes.map((node) =>
            readStream.serializeNode(node)
          );
          expectedBuffers.push(
            Buffer.from(JSON.stringify({ height: 5 }), 'utf8')
          );

          expect(receivedBuffers).toEqual(expectedBuffers);
          done();
        } catch (error) {
          done(error);
        }
      });
    });
  });

  describe('MerkleTreeWriteStream', () => {
    it('should write nodes correctly', (done) => {
      const writeStream = new MerkleTreeWriteStream();

      writeStream.on('finish', () => {
        try {
          const receivedData = writeStream.getMerkleTreeData();

          const receivedDataStringified = {
            ...receivedData,
            nodes: receivedData.nodes.map(([index, fieldElement]) => [
              index.toString(),
              fieldElement,
            ]),
          };

          const sampleDataStringified = {
            ...sampleData,
            nodes: sampleData.nodes.map(([index, fieldElement]) => [
              index.toString(),
              fieldElement,
            ]),
          };

          expect(receivedDataStringified).toEqual(sampleDataStringified);
          done();
        } catch (error) {
          done(error);
        }
      });

      const readStream = new MerkleTreeReadStream(sampleData);
      readStream.pipe(writeStream);

      readStream.on('end', () => {
        writeStream.end();
      });
    });
  });
});
