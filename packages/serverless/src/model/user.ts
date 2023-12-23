import ModelCollection from './collection';
import { ModelDocument } from './document';

export class DocumentUser extends ModelDocument {
  static getInstance(databaseName: string, collectionName: string) {
    return new ModelCollection(databaseName, collectionName).getDocument();
  }
}

export default DocumentUser;
