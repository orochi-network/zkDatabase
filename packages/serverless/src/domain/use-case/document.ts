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
  TDocumentField,
  TDocumentQueuedData,
  TDocumentRecordNullable,
  TPagination,
  TParamCollection,
  TParamDocument,
  TPermissionSudo,
  TSerializedValue,
} from '@zkdb/common';
import { Permission, PermissionBase } from '@zkdb/permission';
import {
  ModelGenericQueue,
  ModelSequencer,
  TCompoundSession,
  zkDatabaseConstant,
} from '@zkdb/storage';
import { ClientSession } from 'mongodb';
import { logger } from '@helper';
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
    const [{ insertedId: documentObjectId }, docId] =
      await imDocument.insertOneFromListField(
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
    const operationNumber = await imSequencer.nextValue(
      ESequencer.DataOperation,
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
        merkleIndex,
        operationNumber,
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
        documentObjectId,
      },
      operationNumber,
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

    const oldDocument = await imDocument.findOne(
      { docId, active: true },
      {
        session: compoundSession.serverless,
      }
    );

    if (oldDocument === null) {
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
      ...Object.entries(oldDocument.document).reduce(
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
      { ...permissionParam, docId: oldDocument.docId },
      compoundSession.serverless
    );
    if (!actorPermissionDocument.write) {
      throw new Error(
        `Access denied: Actor '${actor}' does not have 'write' permission for the specified document.`
      );
    }

    const documentRecord = fieldArrayToRecord(validatedDocument);

    const [{ insertedId: newDocumentObjectId }] = await imDocument.update(
      oldDocument.docId,
      documentRecord,
      compoundSession.serverless
    );

    const imSequencer = await ModelSequencer.getInstance(
      databaseName,
      compoundSession.serverless
    );
    const operationNumber = await imSequencer.nextValue(
      ESequencer.DataOperation,
      compoundSession.serverless
    );

    // Update document metadata
    const imDocumentMetadata = new ModelMetadataDocument(databaseName);
    imDocumentMetadata.updateOne(
      { docId: oldDocument.docId },
      {
        $set: {
          operationNumber,
          updatedAt: new Date(),
        },
      },
      { session: compoundSession.serverless }
    );

    await Prover.update(
      {
        databaseName,
        collectionName,
        docId: oldDocument.docId,
        newDocument: validatedDocument,
        newDocumentObjectId,
        oldDocumentObjectId: oldDocument._id,
      },
      operationNumber,
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

    const updateResult = await imDocument.updateMany(
      {
        docId: document.docId,
        active: true,
      },
      {
        $set: {
          active: false,
        },
      },
      { session: compoundSession.serverless }
    );

    if (updateResult.modifiedCount !== 1) {
      logger.error(
        `Setting active document with docID \`${docId}\` to false should only update ONLY one document, but \
updated ${updateResult.modifiedCount} documents.`
      );
    }

    const imSequencer = await ModelSequencer.getInstance(
      databaseName,
      compoundSession.serverless
    );
    const operationNumber = await imSequencer.nextValue(
      ESequencer.DataOperation,
      compoundSession.serverless
    );

    await Prover.delete(
      {
        databaseName,
        collectionName,
        docId: document.docId,
        oldDocumentObjectId: document._id,
      },
      operationNumber,
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

  static async merkleProofStatus(
    permissionParam: TPermissionSudo<TParamDocument>,
    { serverless, minaService }: TCompoundSession
  ): Promise<EQueueTaskStatus> {
    const { databaseName, collectionName, actor, docId } = permissionParam;

    if (
      !(await PermissionSecurity.document(permissionParam, serverless)).read
    ) {
      throw new Error(
        `Actor '${actor}' does not have 'read' permission for collection '${collectionName}' \
in database '${databaseName}'.`
      );
    }

    const imDocumentMetadata = new ModelMetadataDocument(databaseName);
    const documentMetadata = await imDocumentMetadata.findOne(
      { docId },
      { session: serverless }
    );

    if (documentMetadata == null) {
      throw new Error(`Document metadata with docId '${docId}' not found.`);
    }

    const imDocumentQueue =
      await ModelGenericQueue.getInstance<TDocumentQueuedData>(
        zkDatabaseConstant.globalCollection.documentQueue,
        minaService
      );

    const queuedTaskForThisDocument = await imDocumentQueue.findOne(
      {
        data: {
          docId,
        },
      },
      { session: minaService }
    );

    if (queuedTaskForThisDocument !== null) {
      return queuedTaskForThisDocument.status;
    }

    // If there is no queued task for this document, it's probably already
    // processed and removed from the queue. Check and compare with the latest
    // processed merkle index to make sure that the document is indeed
    // processed.

    const imModelSequencer = await ModelSequencer.getInstance(
      databaseName,
      serverless
    );

    const latestProcessedOperation = await imModelSequencer.current(
      ESequencer.ProvedMerkleRoot,
      serverless
    );

    if (BigInt(documentMetadata.operationNumber) <= latestProcessedOperation) {
      return EQueueTaskStatus.Success;
    }

    logger.error(
      `The document with docId '${docId}', collection '${collectionName}' in database '${databaseName}' \
with sequence number '${documentMetadata.operationNumber}' is neither processed nor queued, task is missing.`
    );

    return EQueueTaskStatus.Failed;
  }
}
