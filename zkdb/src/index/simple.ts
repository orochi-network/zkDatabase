import fs from 'fs';
import crypto from 'crypto';

type TMainIndex = any[][];

export interface IIndexRecord {
  collection: string;
  key: string;
  digest: string;
}

export interface IIndexing extends IIndexRecord {
  index: number;
}

export interface IKVIndex {
  [key: string]: any;
}

function digestStrings(...args: string[]) {
  return crypto.createHash('sha256').update(args.join('')).digest('hex');
}

function digestRecord(record: {
  collection: string;
  key: string;
  digest: string;
}) {
  return `${record.collection}/${record.key}/${record.digest}`;
}

function digestToRecord(digestOfRecord: string) {
  const [collection, key, digest] = digestOfRecord.split('/');
  return { collection, key, digest };
}

class IndexResult {
  private ref: SimpleIndexing;
  private records: IIndexing[];

  constructor(ref: SimpleIndexing, records: IIndexing[] = []) {
    this.records = records;
    this.ref = ref;
  }

  public isEmpty(): boolean {
    return this.records.length === 0;
  }

  public update(indexing: IKVIndex): IndexResult {
    for (let i = 0; i < this.records.length; i += 1) {
      const record = this.records[i];
      this.ref.update(record.index, indexing);
    }
    return this;
  }

  public delete(): IndexResult {
    for (let i = 0; i < this.records.length; i += 1) {
      this.ref.delete(this.records[i].index);
    }
    return this;
  }

  public get(): IIndexing[] {
    return this.records;
  }
}

/**
 * @todo Implement B-Tree or RB-Tree to index the data
 * instead of this stupid approach
 */
export class SimpleIndexing {
  // Indexer is a mapping from record to index
  private indexer: TMainIndex = [];

  private collection: string = 'default';

  constructor(indexer: TMainIndex = []) {
    this.indexer = indexer;
  }

  public use(collection: string): SimpleIndexing {
    this.collection = collection;
    return this;
  }

  private addOneDigest(
    key: string,
    digest: string,
    enforceIndex?: number
  ): IndexResult {
    const index = enforceIndex || this.indexer.length;
    const recordDigest = digestRecord({
      collection: this.collection,
      key,
      digest,
    });
    if (typeof enforceIndex === 'undefined') {
      this.indexer.push([this.indexer.length, recordDigest]);
    } else {
      this.indexer[enforceIndex].push(recordDigest);
    }
    return new IndexResult(this, [
      {
        index,
        collection: this.collection,
        key,
        digest,
      },
    ]);
  }

  public addOne(key: string, value: any, enforceIndex?: number): IndexResult {
    if (
      typeof enforceIndex !== 'undefined' &&
      enforceIndex > this.indexer.length
    ) {
      throw new Error('Enforcing index is out of range');
    }
    return this.addOneDigest(
      key,
      digestStrings(typeof value === 'string' ? value : value.toString()),
      enforceIndex
    );
  }

  public add(indexing: IKVIndex): IndexResult {
    const entries = Object.entries(indexing);
    if (entries.length === 0) {
      throw new Error('Indexing must not be empty');
    }
    const result: IIndexing[] = new Array(entries.length);
    const firstRecord = this.addOne(entries[0][0], entries[0][1]);
    const index = firstRecord.get()[0].index;
    for (let i = 1; i < entries.length; i++) {
      const [key, value] = entries[i];
      const digest = digestStrings(
        typeof value === 'string' ? value : value.toString()
      );
      this.addOne(key, value, index);
      result[i] = {
        collection: this.collection,
        key,
        digest,
        index,
      };
    }
    return new IndexResult(this, result);
  }

  public delete(index: number): boolean {
    if (index > this.indexer.length) {
      throw new Error('Out of range, the index record does not exist');
    }
    this.indexer[index] = [index];
    return true;
  }

  public update(index: number, indexing: IKVIndex): IndexResult {
    const entries = Object.entries(indexing);
    if (entries.length === 0) {
      throw new Error('Indexing must not be empty');
    }
    if (index > this.indexer.length) {
      throw new Error('Index is out of range');
    }
    const oldRecords = new Map<string, IIndexRecord>(
      this.indexer[index].slice(1).map((e) => {
        const record = digestToRecord(e);
        return [record.key, record];
      })
    );
    const result = new Array(entries.length);

    this.indexer[index] = [index];
    for (let i = 0; i < entries.length; i++) {
      const [key, value] = entries[i];
      result[i] = this.addOne(key, value, index);
      // Duplicate record will be overwite
      oldRecords.delete(key);
    }

    for (let record of oldRecords.values()) {
      result.push(this.addOneDigest(record.key, record.digest, index));
    }
    return new IndexResult(this, result);
  }

  public find(key: string, value: any): IndexResult {
    const digest = digestStrings(
      typeof value === 'string' ? value : value.toString()
    );
    const recordDigest = digestRecord({
      collection: this.collection,
      key,
      digest,
    });
    return new IndexResult(
      this,
      this.indexer
        .filter((record) => record.includes(recordDigest))
        .map((e) => ({
          collection: this.collection,
          key,
          digest,
          index: e[0],
        }))
    );
  }

  public get(index: number): IndexResult {
    if (index > this.indexer.length) {
      throw new Error('Out of range, the index record does not exist');
    }
    return new IndexResult(this, this.indexer[index]);
  }

  // To JSON
  public toJSON() {
    return JSON.stringify(this.indexer);
  }

  // To File
  public toFile(filename: string) {
    fs.writeFileSync(filename, this.toJSON());
  }

  // From JSON
  static fromJSON(json: string) {
    return new SimpleIndexing(JSON.parse(json));
  }

  // From File
  static fromFile(filename: string) {
    if (fs.existsSync(filename) === false) {
      throw new Error(`File ${filename} does not exist`);
    }
    return SimpleIndexing.fromJSON(fs.readFileSync(filename, 'utf8'));
  }
}
