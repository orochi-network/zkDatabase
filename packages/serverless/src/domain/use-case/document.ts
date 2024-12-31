// TODO: need end to end testing for every function in this file
// TODO: debug types to annotate the actual correct types
// TODO: pagination does not work properly since we fetch all documents with
// the pagination filter first and then filter them by permission, which can
// lead to less documents being returned than expected. This also affects the
// update and delete operations where we only allow one document to be updated
// leaving the possibility of no documents being updated if the user does not
// have permission to update the document.
import {
  EProofStatusDocument,
  ESequencer,
  PERMISSION_DEFAULT,
  TDocumentField,
  TDocumentRecordNullable,
  TMerkleProof,
  TMetadataDetailDocument,
  TPagination,
  TParamCollection,
  TParamDocument,
  TPermissionSudo,
  TSerializedValue,
  TWithProofStatus,
} from '@zkdb/common';
import { Permission, PermissionBase } from '@zkdb/permission';
import {
  TCompoundSession,
  ModelQueueTask,
  ModelSequencer,
} from '@zkdb/storage';
import { ClientSession } from 'mongodb';
import { ZKDATABASE_GROUP_SYSTEM, ZKDATABASE_USER_SYSTEM } from '@common';
import { getCurrentTime } from '@helper';
import {
  ModelDocument,
  ModelMetadataCollection,
  ModelMetadataDocument,
} from '@model';
import { FilterCriteria, parseQuery } from '../utils';
import { PermissionSecurity } from './permission-security';
import { Prover } from './prover';
import { Schema } from './schema';

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
    permission = PERMISSION_DEFAULT,
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
        `Actor '${actor}' does not have 'write' permission for collection '${collectionName}' in database '${databaseName}'.`
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

    const validatedDocument = Schema.validateDocumentSchema(
      collectionMetadata,
      fields
    );

    const imDocument = ModelDocument.getInstance(databaseName, collectionName);

    // Save the document to the database
    const [_, docId] = await imDocument.insertOneFromListField(
      fieldArrayToRecord(validatedDocument),
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
        document: validatedDocument,
      },
      compoundSession
    );

    return {
      merkleProof: witness,
      docId,
      acknowledged: true,
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
        `Actor '${actor}' does not have 'write' permission for collection '${collectionName}' in database '${databaseName}'.`
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
      session: compoundSession?.serverless,
    });

    if (!collectionMetadata) {
      throw new Error(
        `Metadata not found for collection '${collectionName}' from database '${databaseName}'.`
      );
    }

    const validatedDocument = Schema.validateDocumentSchema(
      collectionMetadata,
      update
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

    if (Object.keys(update).length === 0) {
      throw new Error(
        'Document array is empty. At least one field is required.'
      );
    }

    await imDocument.update(
      document.docId,
      fieldArrayToRecord(validatedDocument),
      compoundSession.serverless
    );

    const witness = await Prover.update(
      {
        databaseName,
        collectionName,
        docId: document.docId,
        newDocument: validatedDocument,
      },
      compoundSession
    );

    return witness;
  }

  static async drop(
    permissionParam: TPermissionSudo<TParamCollection>,
    docId: string,
    compoundSession: TCompoundSession
  ): Promise<TMerkleProof[]> {
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
        `Actor '${actor}' does not have 'write' permission for collection '${collectionName}' in database '${databaseName}'.`
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

    const witness = await Prover.delete({
      databaseName,
      collectionName,
      docId: document.docId,
    });

    return witness;
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
        `Actor '${actor}' does not have 'read' permission for collection '${collectionName}' in database '${databaseName}'.`
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
    databaseName: string
  ): Promise<TMetadataDetailDocument<TDocumentRecordNullable>[]> {
    if (!listDocument.length) {
      return [];
    }

    const docIds = listDocument.map((doc) => doc.docId);

    const metadataRecords = await new ModelMetadataDocument(databaseName)
      .find({
        docId: { $in: docIds },
      })
      .toArray();

    // Create a map for quick metadata lookup
    const metadataMap = new Map(
      metadataRecords.map((metadata) => [metadata.docId, metadata])
    );

    // Combine documents with their metadata
    return listDocument.map((doc) => ({
      ...doc,
      metadata: metadataMap.get(doc.docId)!!,
    }));
  }

  /** Fill proof status for a list of documents. Note that this won't check for
   * permission and will return all proof status for the given documents. */
  static async fillProofStatus(
    listDocument: TDocumentRecordNullable[],
    collectionName: string
  ): Promise<TWithProofStatus<TDocumentRecordNullable>[]> {
    const listQueueTask = await ModelQueueTask.getInstance()
      .find({ collectionName })
      .toArray();

    const taskMap = new Map(
      listQueueTask?.map((task) => [task.docId, task.status]) || []
    );

    return listDocument.map((item) => {
      return {
        ...item,
        proofStatus: taskMap.get(item.docId) || EProofStatusDocument.Failed,
      };
    });
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
        `Actor '${actor}' does not have 'read' permission for collection '${collectionName}' in database '${databaseName}'.`
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
}
