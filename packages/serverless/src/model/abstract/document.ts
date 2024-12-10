/* eslint-disable no-await-in-loop */
// eslint-disable-next-line max-classes-per-file
import {
  TDocumentField,
  TDocumentRecordResponse,
  TProvableTypeString,
} from '@zkdb/common';
import {
  DB,
  ModelBasic,
  ModelCollection,
  ModelMetadataDatabase,
} from '@zkdb/storage';
import { randomUUID } from 'crypto';
import { ClientSession, Filter, Long, OptionalId } from 'mongodb';
import { getCurrentTime } from '../../helper/common.js';
import logger from '../../helper/logger.js';

/** Database-serialized version of a document record. */
export type TDocumentRecordSerialized = Omit<
  TDocumentRecordResponse,
  'document'
> & {
  document: Record<string, TContractSchemaFieldSerializable>;
};

/** Map of Provable types to their corresponding BSON types. */
type TProvableSerializationMap = {
  CircuitString: string;
  UInt32: Long;
  Int64: Long;
  Bool: boolean;
  PrivateKey: string;
  PublicKey: string;
  Signature: string;
  Character: string;
  Sign: boolean;

  // Leaving as any as not yet implemented, reason: concerns about indexing,
  // operators like $gt, $lt and the combination of them (e.g. will $gt on the
  // indexed field work and how?)
  Field: any;

  // Leaving as any as not yet implemented, reason: won't fit in bson 64-bit
  // integer
  UInt64: any;

  // Leaving as any as not yet implemented
  MerkleMapWitness: any;
};

/**
 * Represents a field with a name, kind, and the actual value that can be stored
 * in the database. Rendered as a union of all possible field types.
 */
export type TContractSchemaFieldSerializable = {
  [K in TProvableTypeString]: {
    name: string;
    kind: K;
    value: TProvableSerializationMap[K];
  };
}[TProvableTypeString];

/**
 * ModelDocument is a class that extends ModelBasic.
 * ModelDocument handle document of zkDatabase with index hook.
 */
export class ModelDocument extends ModelBasic<
  OptionalId<TDocumentRecordSerialized>
> {
  public static instances = new Map<string, ModelDocument>();

  private constructor(databaseName: string, collectionName: string) {
    super(databaseName, DB.service, collectionName, {
      timeseries: {
        timeField: 'updatedAt',
        granularity: 'seconds',
      },
    });
  }

  get modelDatabase() {
    return ModelMetadataDatabase.getInstance();
  }

  get modelCollection() {
    return ModelCollection.getInstance(
      this.databaseName!,
      DB.service,
      this.collectionName!
    );
  }

  public static getInstance(databaseName: string, collectionName: string) {
    const key = `${databaseName}.${collectionName}`;
    if (!ModelDocument.instances.has(key)) {
      ModelDocument.instances.set(
        key,
        new ModelDocument(databaseName, collectionName)
      );
    }
    return ModelDocument.instances.get(key)!;
  }

  /**
   * Serializes a document by converting its fields to the appropriate database
   * field types.
   */
  public static serializeDocument(
    document: Record<string, TDocumentField>
  ): Record<string, TContractSchemaFieldSerializable> {
    return Object.values(document)
      .map((field) => {
        switch (field.kind) {
          case 'UInt32':
            return {
              ...field,
              value: new Long(field.value),
            };
          case 'Int64':
            return {
              ...field,
              value: new Long(field.value),
            };
          case 'Bool':
          case 'Sign':
          case 'Character':
          case 'PublicKey':
          case 'PrivateKey':
          case 'Signature':
          case 'CircuitString':
            return field;
          case 'Field':
          case 'UInt64':
          case 'MerkleMapWitness':
            throw new Error(
              `Field type ${field.kind} is not yet supported in database`
            );
          default:
            throw new Error(
              `Unhandled field type, it is required that we handle all \
possible field kinds explicitly to ensure correctness.`
            );
        }
      })
      .reduce(
        (acc, field) => {
          acc[field.name] = field;
          return acc;
        },
        {} as Record<string, TContractSchemaFieldSerializable>
      );
  }

  /** Deserializes a document by converting its fields to the appropriate
   * document field types. */
  public static deserializeDocument(
    document: Record<string, TContractSchemaFieldSerializable>
  ): Record<string, TDocumentField> {
    return Object.values(document)
      .map((field) => {
        switch (field.kind) {
          case 'UInt32':
            return {
              ...field,
              value: field.value.toNumber(),
            };
          case 'Int64':
            return {
              ...field,
              value: field.value.toBigInt(),
            };
          case 'Bool':
          case 'Sign':
          case 'Character':
          case 'PublicKey':
          case 'PrivateKey':
          case 'Signature':
          case 'CircuitString':
            return field;
          case 'Field':
          case 'UInt64':
          case 'MerkleMapWitness':
            throw new Error(
              `Field type ${field.kind} is not yet supported in database`
            );
          default:
            throw new Error(
              `Unhandled field type, it is required that we handle all \
possible field kinds explicitly to ensure correctness.`
            );
        }
      })
      .reduce(
        (acc, field) => {
          acc[field.name] = field;
          return acc;
        },
        {} as Record<string, TDocumentField>
      );
  }

  /** Construct a document with fields and insert it to the collection, marking
   * it as active */
  public async insertOneFromFields(
    fields: Record<string, TContractSchemaFieldSerializable>,
    docId?: string,
    session?: ClientSession
  ): Promise<TDocumentRecordSerialized> {
    return this.insertOne(
      {
        document: fields,
        docId: docId || randomUUID(),
        active: true,
        createdAt: getCurrentTime(),
        updatedAt: getCurrentTime(),
      },
      session
    );
  }

  public async insertOne(
    doc: OptionalId<TDocumentRecordSerialized>,
    session?: ClientSession
  ): Promise<TDocumentRecordSerialized> {
    logger.debug(`Inserting document to collection`, { doc });
    const result = await this.collection.insertOne(doc, { session });

    if (result.acknowledged) {
      return {
        ...doc,
        _id: doc._id || result.insertedId,
      };
    }

    throw Error('Error occurred when inserting document');
  }

  /** Update a document by creating a new revision and setting the old one to
   * inactive. */
  public async updateOne(
    docId: string,
    fields: Record<string, TContractSchemaFieldSerializable>,
    session: ClientSession
  ) {
    logger.debug(`ModelDocument::updateDocument()`, { docId });
    const findDocument = await this.findOne({ docId });

    if (findDocument) {
      // Insert new document
      const documentUpdated = await this.insertOneFromFields(
        fields,
        findDocument.docId,
        session
      );

      // Set old document to active: false
      // Point the nextId to updated document to keep track history
      await this.collection.findOneAndUpdate(
        { _id: findDocument._id },
        {
          $set: { active: false, nextId: documentUpdated._id },
        },
        {
          session,
        }
      );

      return documentUpdated;
    }

    throw new Error('No documents found to update');
  }

  public async dropOne(docId: string, session?: ClientSession) {
    logger.debug(`ModelDocument::drop()`, { docId });
    const findDocument = await this.find({ docId });

    const docIds = findDocument.map((doc) => doc.docId);

    // eslint-disable-next-line @typescript-eslint/no-shadow
    const bulkOps = docIds.map((docId) => ({
      updateMany: {
        filter: { docId },
        update: {
          $set: {
            active: false,
          },
        },
      },
    }));

    // Execute the bulk update
    const result = await this.collection.bulkWrite(bulkOps, { session });

    logger.debug(
      `ModelDocument::drop() - All versions of documents soft deleted`,
      { result }
    );

    return result;
  }

  public async findOne(filter: Filter<any>, session?: ClientSession) {
    logger.debug(`ModelDocument::findOne()`, { filter });
    return this.collection.findOne(
      { ...filter, active: true },
      {
        sort: { updatedAt: -1 },
        session,
      }
    );
  }

  public async findHistoryOne(docId: string, session?: ClientSession) {
    const documents = this.find({ docId }, session);
    return documents;
  }

  public async find(filter?: Filter<any>, session?: ClientSession) {
    logger.debug(`ModelDocument::find()`, { filter });
    return this.collection.find(filter || {}, { session }).toArray();
  }

  public async countActiveDocuments(filter?: Filter<any>) {
    return this.collection.countDocuments({ ...filter, active: true });
  }
}

export default ModelDocument;
