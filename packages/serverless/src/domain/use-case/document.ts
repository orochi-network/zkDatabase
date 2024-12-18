// TODO: need end to end testing for every function in this file
// TODO: debug types to annotate the actual correct types
// TODO: pagination does not work properly since we fetch all documents with
// the pagination filter first and then filter them by permission, which can
// lead to less documents being returned than expected.
// TODO: group all the functions into a static class to organize them better
import {
  EProofStatusDocument,
  ESequencer,
  PERMISSION_DEFAULT,
  TDocumentField,
  TDocumentRecord,
  TDocumentRecordNullable,
  TMerkleProof,
  TMetadataDetailDocument,
  TPagination,
  TParamCollection,
  TPermissionSudo,
  TWithProofStatus,
} from '@zkdb/common';
import { Permission, PermissionBase } from '@zkdb/permission';
import {
  TCompoundSession,
  ModelDatabase,
  ModelQueueTask,
  ModelSequencer,
  withTransaction,
  zkDatabaseConstant,
} from '@zkdb/storage';
import { ClientSession } from 'mongodb';
import {
  DEFAULT_PAGINATION,
  ZKDATABASE_GROUP_SYSTEM,
  ZKDATABASE_USER_SYSTEM,
} from '@common';
import { getCurrentTime } from '@helper';
import {
  ModelDocument,
  ModelMetadataCollection,
  ModelMetadataDocument,
} from '@model';
import { FilterCriteria, parseQuery } from '../utils';
import { PermissionSecurity } from './permission-security';
import { Prover } from './prover';

/** Transform an array of document fields to a document record. */
export function fieldArrayToRecord(
  fields: TDocumentField[]
): Record<string, TDocumentField> {
  return fields.reduce(
    (acc, field) => {
      acc[field.name] = field;
      return acc;
    },
    {} as Record<string, TDocumentField>
  );
}

export class Document {
  static async findDocument(
    permissionParam: TPermissionSudo<TParamCollection>,
    filter: FilterCriteria,
    session?: ClientSession
  ): Promise<TDocumentRecordNullable | null> {
    const { databaseName, collectionName, actor } = permissionParam;

    const actorPermissionCollection = await PermissionSecurity.collection(
      {
        databaseName,
        collectionName,
        actor,
      },
      session
    );
    if (!actorPermissionCollection.read) {
      throw new Error(
        `Access denied: Actor '${actor}' does not have 'read' permission for collection '${collectionName}'.`
      );
    }

    const modelDocument = ModelDocument.getInstance(
      databaseName,
      collectionName
    );

    const documentRecord = await modelDocument.findOne(parseQuery(filter), {
      session,
    });

    if (!documentRecord) {
      return null;
    }

    const actorPermissionDocument = await PermissionSecurity.document(
      {
        databaseName,
        collectionName,
        actor,
        docId: documentRecord.docId,
      },
      session
    );

    if (!actorPermissionDocument.read) {
      throw new Error(
        `Access denied: Actor '${actor}' does not have 'read' permission for the specified document.`
      );
    }

    return documentRecord;
  }

  static async createDocument(
    permissionParam: TPermissionSudo<TParamCollection>,
    fields: Record<string, TDocumentField>,
    permission = PERMISSION_DEFAULT,
    compoundSession: TCompoundSession
  ) {
    const actorPermissionCollection = await PermissionSecurity.collection(
      permissionParam,
      compoundSession?.serverless
    );

    const { databaseName, collectionName, actor } = permissionParam;

    if (!actorPermissionCollection.write) {
      throw new Error(
        `Access denied: Actor '${actor}' does not have 'write' permission for collection '${collectionName}'.`
      );
    }

    const imDocument = ModelDocument.getInstance(databaseName, collectionName);

    if (Object.keys(fields).length === 0) {
      throw new Error(
        'Document array is empty. At least one field is required.'
      );
    }

    // Save the document to the database
    const [_, docId] = await imDocument.insertOneFromListField(
      fields,
      undefined,
      compoundSession?.serverless
    );

    // 2. Create new sequence value
    const imSequencer = ModelSequencer.getInstance(databaseName);
    const merkleIndex = await imSequencer.nextValue(
      ESequencer.MerkleIndex,
      compoundSession?.serverless
    );

    // 3. Create Metadata
    const imDocumentMetadata = new ModelMetadataDocument(databaseName);

    const imCollectionMetadata =
      ModelMetadataCollection.getInstance(databaseName);

    const documentSchema = await imCollectionMetadata.getMetadata(
      collectionName,
      {
        session: compoundSession?.serverless,
      }
    );

    if (!documentSchema) {
      throw new Error('Cannot get documentSchema');
    }

    const {
      metadata: { permission: collectionPermission },
    } = documentSchema;

    const permissionCombine = Permission.from(permission).combine(
      Permission.from(collectionPermission)
    );

    await imDocumentMetadata.insertOne(
      {
        collectionName,
        docId,
        merkleIndex: merkleIndex.toString(),
        ...{
          // I'm set these to system user and group as default
          // In case this permission don't override by the user
          // this will prevent the user from accessing the data
          group: ZKDATABASE_GROUP_SYSTEM,
          owner: ZKDATABASE_USER_SYSTEM,
        },
        // Overwrite inherited permission with the new one
        permission: permissionCombine.value,
        owner: actor,
        group: documentSchema.metadata.group,
        createdAt: getCurrentTime(),
        updatedAt: getCurrentTime(),
      },
      { session: compoundSession?.serverless }
    );

    const witness = await Prover.create(
      {
        databaseName,
        collectionName,
        docId,
        document: Object.values(fields),
      },
      compoundSession
    );

    return witness;
  }

  static async updateDocument(
    permissionParam: TPermissionSudo<TParamCollection>,
    filter: FilterCriteria,
    update: Record<string, TDocumentField>,
    session: ClientSession
  ) {
    const { databaseName, collectionName, actor } = permissionParam;

    const imDocument = ModelDocument.getInstance(databaseName, collectionName);
    const documentRecord = await withTransaction(async (session) => {
      const oldDocumentRecord = await imDocument.findOne(parseQuery(filter), {
        session,
      });

      if (oldDocumentRecord) {
        const actorPermissionDocument = await PermissionSecurity.document(
          { ...permissionParam, docId: oldDocumentRecord.docId },
          session
        );
        if (!actorPermissionDocument.write) {
          throw new Error(
            `Access denied: Actor '${actor}' does not have 'write' permission for the specified document.`
          );
        }

        if (Object.keys(update).length === 0) {
          throw new Error(
            'Document array is empty. At least one field is required.'
          );
        }

        // TODO: shouldn't we create a new revision and set the old ones as
        // inactive instead? i.e. Using ModelDocument.update()
        await imDocument.updateOne(
          { docId: oldDocumentRecord.docId },
          {
            $set: {
              document: update,
            },
          },
          {
            session,
          }
        );

        return oldDocumentRecord;
      }
    });

    if (documentRecord) {
      const witness = await Prover.update(
        {
          databaseName,
          collectionName,
          docId: documentRecord.docId,
          newDocument: Object.values(update),
        },
        session
      );
      return witness;
    }

    throw Error(
      'Invalid query, the amount of documents that satisfy filter must be only one'
    );
  }

  static async deleteDocument(
    permissionParam: TPermissionSudo<TParamCollection>,
    filter: FilterCriteria
  ): Promise<TMerkleProof[]> {
    const { databaseName, collectionName, actor } = permissionParam;

    const result = await withTransaction(async (session) => {
      const imDocument = ModelDocument.getInstance(
        databaseName,
        collectionName
      );

      const findResult = await imDocument.findOne(parseQuery(filter), {
        session,
      });

      if (findResult) {
        const actorPermissionDocument = await PermissionSecurity.document(
          {
            ...permissionParam,
            docId: findResult.docId,
          },
          session
        );
        if (!actorPermissionDocument.write) {
          throw new Error(
            `Access denied: Actor '${actor}' does not have 'delete' permission for the specified document.`
          );
        }
        await imDocument.dropOne(findResult.docId);
      }

      return findResult;
    });
    if (result) {
      const witness = await Prover.delete({
        databaseName,
        collectionName,
        docId: result.docId,
      });
      return witness;

      // TODO: Should we remove document metadata ???????
      // const modelDocumentMetadata = new ModelDocumentMetadata(databaseName);
      // await modelDocumentMetadata.deleteOne(
      //   { docId: findResult[0].docId },
      //   { session }
      // );
    }

    throw Error('Document not found');
  }

  static async listDocumentWithMetadata(
    permissionParam: TPermissionSudo<TParamCollection>,
    query?: FilterCriteria,
    pagination?: TPagination,
    session?: ClientSession
  ): Promise<TWithProofStatus<TMetadataDetailDocument<TDocumentRecord>>[]> {
    const { db: database } = new ModelDatabase();
    const { databaseName, collectionName, actor } = permissionParam;

    const paginationInfo = pagination || DEFAULT_PAGINATION;
    const pipeline = [];
    if (query) {
      pipeline.push({ $match: parseQuery(query) });
    }
    pipeline.push({
      $lookup: {
        from: zkDatabaseConstant.databaseCollection.metadataDocument,
        let: { docId: '$docId' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$docId', '$$docId'] },
            },
          },
        ],
        as: 'metadata',
      },
      $skip: paginationInfo.offset,
      $limit: paginationInfo.limit,
    });

    const listDocumentWithMetadata = (await database
      .collection(collectionName)
      .aggregate(pipeline, { session })
      .toArray()) as TMetadataDetailDocument<TDocumentRecord>[];

    const listQueueTask =
      await ModelQueueTask.getInstance().getTasksByCollection(collectionName);

    const taskMap = new Map(
      listQueueTask?.map((task) => [task.docId, task.status]) || []
    );

    const result = await PermissionSecurity.filterMetadataDocumentDetail(
      databaseName,
      listDocumentWithMetadata,
      actor,
      PermissionBase.permissionRead()
    );

    return result.map((item) => {
      return {
        ...item,
        proofStatus: taskMap.get(item.docId) || EProofStatusDocument.Failed,
      };
    });
  }
}
