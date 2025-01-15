// TODO: need end to end testing for every function in this file
// TODO: debug types to annotate the actual correct types
// TODO: pagination does not work properly since we fetch all documents with
// the pagination filter first and then filter them by permission, which can
// lead to less documents being returned than expected. This also affects the
// update and delete operations where we only allow one document to be updated
// leaving the possibility of no documents being updated if the user does not
// have permission to update the document.
import { ZKDATABASE_GROUP_SYSTEM, ZKDATABASE_USER_SYSTEM } from '@common';
import {
  ModelDocument,
  ModelMetadataCollection,
  ModelMetadataDocument,
} from '@model';
import {
  EQueueTaskStatus,
  ESequencer,
  PERMISSION_DEFAULT,
  TDatabaseMerkleProofStatusResponse,
  TDocumentField,
  TDocumentMetadata,
  TDocumentQueuedData,
  TDocumentRecordNullable,
  TMetadataDetailDocument,
  TPagination,
  TParamCollection,
  TParamDocument,
  TPermissionSudo,
  TSerializedValue,
  TWithQueueStatus,
} from '@zkdb/common';
import { Permission, PermissionBase } from '@zkdb/permission';
import {
  ModelGenericQueue,
  ModelSequencer,
  TCompoundSession,
  zkDatabaseConstant,
} from '@zkdb/storage';
import { ClientSession } from 'mongodb';
import { FilterCriteria, parseQuery } from '../utils';
import { DocumentSchema } from './document-schema';
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
  static async create(
    permissionParam: TPermissionSudo<TParamCollection>,
    fields: Record<string, TSerializedValue>,
    compoundSession: TCompoundSession,
    permission = PERMISSION_DEFAULT
  ) {
    const { databaseName, collectionName, actor } = permissionParam;

    if (
      !(
        await PermissionSecurity.collection(
          permissionParam,
          compoundSession.serverless
        )
      ).write
    ) {
      throw new Error(
        `Actor '${actor}' does not have 'write' permission for collection '${collectionName}' \
in database '${databaseName}'.`
      );
    }

    const collectionMetadata = await ModelMetadataCollection.getInstance(
      databaseName
    ).getMetadata(collectionName, {
      session: compoundSession?.serverless,
    });

    if (!collectionMetadata) {
      throw new Error(
        `Metadata not found for collection '${collectionName}' from database '${databaseName}'.`
      );
    }

    const validatedDocument = DocumentSchema.validateDocumentSchema(
      collectionMetadata,
      fields
    );

    const imDocument = ModelDocument.getInstance(databaseName, collectionName);

    // Save the document to the database
    const [_, docId] = await imDocument.insertOneFromListField(
      fieldArrayToRecord(validatedDocument),
      undefined,
      compoundSession.serverless
    );

    // 2. Create new sequence value
    const imSequencer = await ModelSequencer.getInstance(
      databaseName,
      compoundSession.serverless
    );
    const merkleIndex = await imSequencer.nextValue(
      ESequencer.MerkleIndex,
      compoundSession.serverless
    );

    // 3. Create Metadata
    const imDocumentMetadata = new ModelMetadataDocument(databaseName);

    const { permission: collectionPermission } = collectionMetadata;

    const permissionCombine = permission.combine(
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
        group: collectionMetadata.group,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      { session: compoundSession.serverless }
    );

    await Prover.create(
      {
        databaseName,
        collectionName,
        docId,
        document: validatedDocument,
      },
      compoundSession
    );

    return {
      docId,
      acknowledged: true,
      // NOTE: this returns an extra validated field, remove this or not?
      document: fieldArrayToRecord(validatedDocument),
    };
  }

  static async update(
    permissionParam: TPermissionSudo<TParamCollection>,
    docId: string,
    update: Record<string, TSerializedValue>,
    compoundSession: TCompoundSession
  ) {
    const { databaseName, collectionName, actor } = permissionParam;

    if (
      !(
        await PermissionSecurity.collection(
          permissionParam,
          compoundSession.serverless
        )
      ).write
    ) {
      throw new Error(
        `Actor '${actor}' does not have 'write' permission for collection '${collectionName}' \
in database '${databaseName}'.`
      );
    }

    const imDocument = ModelDocument.getInstance(databaseName, collectionName);

    const document = await imDocument.findOne(
      { docId, active: true },
      {
        session: compoundSession.serverless,
      }
    );

    if (document === null) {
      throw new Error(
        `Document with docId '${docId}' not found or is dropped.`
      );
    }

    const collectionMetadata = await ModelMetadataCollection.getInstance(
      databaseName
    ).getMetadata(collectionName, {
      session: compoundSession.serverless,
    });

    if (!collectionMetadata) {
      throw new Error(
        `Metadata not found for collection '${collectionName}' from database '${databaseName}'.`
      );
    }

    const newDocument = {
      ...Object.entries(document.document).reduce(
        (acc, [key, value]) => {
          acc[key] = value.value;
          return acc;
        },
        {} as Record<string, TSerializedValue>
      ),
      ...update,
    };

    const validatedDocument = DocumentSchema.validateDocumentSchema(
      collectionMetadata,
      newDocument
    );

    const actorPermissionDocument = await PermissionSecurity.document(
      { ...permissionParam, docId: document.docId },
      compoundSession.serverless
    );
    if (!actorPermissionDocument.write) {
      throw new Error(
        `Access denied: Actor '${actor}' does not have 'write' permission for the specified document.`
      );
    }

    const documentRecord = fieldArrayToRecord(validatedDocument);

    await imDocument.update(
      document.docId,
      documentRecord,
      compoundSession.serverless
    );

    await Prover.update(
      {
        databaseName,
        collectionName,
        docId: document.docId,
        newDocument: validatedDocument,
      },
      compoundSession
    );

    return documentRecord;
  }

  static async drop(
    permissionParam: TPermissionSudo<TParamCollection>,
    docId: string,
    compoundSession: TCompoundSession
  ): Promise<string> {
    const { databaseName, collectionName, actor } = permissionParam;

    if (
      !(
        await PermissionSecurity.collection(
          permissionParam,
          compoundSession.serverless
        )
      ).write
    ) {
      throw new Error(
        `Actor '${actor}' does not have 'write' permission for collection '${collectionName}' \
in database '${databaseName}'.`
      );
    }

    const imDocument = ModelDocument.getInstance(databaseName, collectionName);

    const document = await imDocument.findOne(
      { docId, active: true },
      {
        session: compoundSession.serverless,
      }
    );

    if (document === null) {
      throw new Error(
        `Document with docId '${docId}' not found or is dropped.`
      );
    }

    const actorDocumentPermission = await PermissionSecurity.document(
      {
        databaseName,
        collectionName,
        actor,
        docId: document.docId,
      },
      compoundSession.serverless
    );

    if (!actorDocumentPermission.write) {
      throw new Error(
        `Actor '${actor}' does not have 'write' permission for the specified document.`
      );
    }

    await imDocument.updateMany(
      {
        docId: document.docId,
        active: true,
      },
      {
        $set: {
          active: false,
        },
      }
    );

    await Prover.delete(
      {
        databaseName,
        collectionName,
        docId: document.docId,
      },
      compoundSession
    );

    return document.docId;
  }

  /** Query for documents given a filter criteria. Returns a list of documents
   * and the total number of documents that satisfy the filter criteria. */
  static async query(
    permissionParam: TPermissionSudo<TParamCollection>,
    query: FilterCriteria,
    pagination: TPagination,
    session?: ClientSession
  ): Promise<[TDocumentRecordNullable[], number]> {
    const { databaseName, collectionName, actor } = permissionParam;

    if (!(await PermissionSecurity.collection(permissionParam, session)).read) {
      throw new Error(
        `Actor '${actor}' does not have 'read' permission for collection '${collectionName}' \
in database '${databaseName}'.`
      );
    }

    const parsedQuery = parseQuery(query);

    const [listDocument, totalDocument] = await Promise.all([
      ModelDocument.getInstance(databaseName, collectionName)
        .find({ ...parsedQuery, active: true }, { session })
        .limit(pagination.limit)
        .skip(pagination.offset)
        .toArray(),

      ModelDocument.getInstance(
        databaseName,
        collectionName
      ).countActiveDocuments(parsedQuery),
    ]);

    return [
      await PermissionSecurity.filterDocument(
        databaseName,
        collectionName,
        listDocument,
        actor,
        PermissionBase.permissionRead()
      ),
      totalDocument,
    ];
  }

  /** Fill document metadata for a list of documents. Note that this won't
   * check for permission and will return all metadata records for the given
   * documents. */
  static async fillMetadata(
    listDocument: TDocumentRecordNullable[],
    databaseName: string,
    session: ClientSession
  ): Promise<TMetadataDetailDocument<TDocumentRecordNullable>[]> {
    if (!listDocument.length) {
      return [];
    }

    const docIds = listDocument.map((doc) => doc.docId);

    const metadataRecords = await new ModelMetadataDocument(databaseName)
      .find(
        {
          docId: { $in: docIds },
        },
        { session }
      )
      .toArray();

    // Create a map for quick metadata lookup
    const metadataMap = new Map(
      metadataRecords.map((metadata) => [metadata.docId, metadata])
    );

    // Combine documents with their metadata
    return listDocument.map((doc) => ({
      ...doc,
      metadata: metadataMap.get(doc.docId)!,
    }));
  }

  /** Fill proof status for a list of documents. Note that this won't check for
   * permission and will return all proof status for the given documents. */
  static async fillMerkleProofStatus(
    listDocument: (TDocumentRecordNullable & { metadata: TDocumentMetadata })[],
    databaseName: string,
    collectionName: string,
    // NOTE: This is proof service session since we using ModelGenericQueue from proof database
    session: ClientSession
  ): Promise<TWithQueueStatus<TDocumentRecordNullable>[]> {
    const imRollUpQueue =
      await ModelGenericQueue.getInstance<TDocumentQueuedData>(
        zkDatabaseConstant.globalCollection.documentQueue,
        session
      );

    const listQueueTask = await imRollUpQueue
      .find(
        {
          databaseName,
          // TODO: index these fields
          'data.collectionName': collectionName,
          'data.docId': { $in: listDocument.map((doc) => doc.docId) },
        },
        { session }
      )
      .toArray();

    const imModelSequencer = await ModelSequencer.getInstance(
      databaseName,
      session
    );

    const latestProcessedMerkleIndex = await imModelSequencer.current(
      ESequencer.ProvedMerkleRoot,
      session
    );

    const taskMap = new Map(
      listQueueTask.map((task) => [task.data.docId, task.status])
    );

    return listDocument.map((item) => ({
      queueStatus:
        // The queue may not contain the task for this document since
        // successfully completed tasks are immediately removed (failed tasks
        // are kept persisted for diagnosis). Therefore, we assume tasks with
        // merkleIndex smaller than the latest processed merkleIndex were
        // successful.
        taskMap.get(item.docId) ||
        BigInt(item.metadata.merkleIndex) > latestProcessedMerkleIndex
          ? EQueueTaskStatus.Queued
          : EQueueTaskStatus.Success,
      ...item,
    }));
  }

  /** List an active document's revisions, not including the active one. */
  static async history(
    permissionParam: TPermissionSudo<TParamDocument>,
    pagination: TPagination,
    session?: ClientSession
  ): Promise<[TDocumentRecordNullable[], number]> {
    const { databaseName, collectionName, actor, docId } = permissionParam;

    if (!(await PermissionSecurity.collection(permissionParam, session)).read) {
      throw new Error(
        `Actor '${actor}' does not have 'read' permission for collection '${collectionName}' \
in database '${databaseName}'.`
      );
    }

    const imDocument = ModelDocument.getInstance(databaseName, collectionName);

    const document = await imDocument.findOne(
      { docId, active: true },
      { session }
    );
    if (!document) {
      throw new Error(`Document with docId '${docId}' not found.`);
    }

    const actorPermissionDocument = await PermissionSecurity.document(
      {
        databaseName,
        collectionName,
        actor,
        docId,
      },
      session
    );
    if (!actorPermissionDocument.read) {
      throw new Error(
        `Access denied: Actor '${actor}' does not have 'read' permission for the specified document.`
      );
    }

    const [listRevision, totalRevision] = await Promise.all([
      imDocument
        .find(
          {
            docId,
            active: false,
          },
          { session }
        )
        .limit(pagination.limit)
        .skip(pagination.offset)
        .toArray(),

      imDocument.collection.countDocuments(
        { docId, active: false },
        { session }
      ),
    ]);

    return [listRevision, totalRevision];
  }

  static async databaseMerkleProofStatus(
    databaseName: string,
    actor: string,
    session: ClientSession
  ): Promise<TDatabaseMerkleProofStatusResponse> {
    if (
      !(
        await PermissionSecurity.database(
          {
            databaseName,
            actor,
          },
          session
        )
      ).read
    ) {
      throw new Error(
        `Actor '${actor}' does not have 'read' permission for database '${databaseName}'.`
      );
    }

    const imDocumentQueue =
      await ModelGenericQueue.getInstance<TDocumentQueuedData>(
        zkDatabaseConstant.globalCollection.documentQueue,
        session
      );

    const latestFailedTask = await imDocumentQueue
      .find(
        {
          databaseName,
          status: EQueueTaskStatus.Failed,
        },
        { session }
      )
      .sort({ sequenceNumber: -1, createdAt: -1 })
      .limit(1)
      .next();

    const imModelSequencer = await ModelSequencer.getInstance(
      databaseName,
      session
    );

    const latestProcessedMerkleIndex = await imModelSequencer.current(
      ESequencer.ProvedMerkleRoot,
      session
    );

    const latestDataOperationNumber = await imModelSequencer.current(
      ESequencer.DataOperation,
      session
    );

    return {
      /* eslint-disable-next-line no-nested-ternary --
       * for lazy evaluation */
      status: latestFailedTask
        ? EQueueTaskStatus.Failed
        : latestDataOperationNumber === latestProcessedMerkleIndex
          ? EQueueTaskStatus.Success
          : EQueueTaskStatus.Processing,
      latestProcessedMerkleIndex: BigInt(latestProcessedMerkleIndex),
    };
  }
}
