import { Readable } from "stream";
import { StorageEngineLocal } from './local.js';
import * as fs from 'fs';
import mock from 'mock-fs';

describe('StorageEngineLocal', () => {
  let localStorage: StorageEngineLocal;

  beforeAll(async () => {
    localStorage = await StorageEngineLocal.getInstance({
      location: `./base`,
    });
  });

  afterEach(() => {
    mock.restore();
  });

  it('createReadStream', async () => {
    mock({
      './base/merkle.bson': 'file content',
    });

    const readStream = localStorage.createReadStream('merkle.bson');
    let data = '';
    readStream.on('data', chunk => {
      data += chunk;
    });

    return new Promise<void>((resolve) => {
      readStream.on('end', () => {
        expect(data).toBe('file content');
        resolve();
      });
    });
  });

  
  it('createWriteStream', () => {
    mock();

    const writeStream = localStorage.createWriteStream('merkle.bson');
    writeStream.write('file content');
    writeStream.end();

    const fileContent = fs.readFileSync('./base/merkle.bson', 'utf8');
    expect(fileContent).toBe('file content');
  });

  it('streamWriteFile', async () => {
    mock();

    const contentStream = Readable.from('file content');
    const filePath = await localStorage.streamWriteFile('merkle.bson', contentStream as fs.ReadStream);

    expect(filePath).toBe('./base/merkle.bson');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    expect(fileContent).toBe('file content');
  });
});
