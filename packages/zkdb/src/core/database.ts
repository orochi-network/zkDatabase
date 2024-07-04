import { Field } from 'o1js';
import {
  createDatabase,
  getDatabaseStatus,
  getRoot,
  listCollections,
} from '../client/index.js';
import Collection from './collection.js';

export class Database {
  private databaseName: string;

  constructor(databaseName: string) {
    if (databaseName.trim() === '') {
      throw Error('Database name cannot be empty');
    }
    this.databaseName = databaseName;
  }

  public async create(merkleHeight: number): Promise<Database> {
    if (!(await createDatabase(this.databaseName, merkleHeight)).dbCreate) {
      throw Error('Error raised during database creation')
    }

    return this;
  }

  public collection(collectionName: string): Collection {
    return new Collection(this.databaseName, collectionName);
  }

  public async getMerkleRoot(): Promise<Field> {
    return Field((await getRoot(this.databaseName)).node)
  }

  public async status() {
    return (await getDatabaseStatus(this.databaseName)).status;
  }

  public async listCollections() {
    return (await listCollections(this.databaseName)).collections;
  }
}
