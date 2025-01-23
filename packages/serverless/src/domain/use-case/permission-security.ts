import {
  ModelMetadataCollection,
  ModelMetadataDocument,
  ModelUserGroup,
} from '@model';
import {
  TCollectionMetadataRecord,
  TDocumentMetadata,
  TDocumentRecordNullable,
  TParamCollection,
  TParamDatabase,
  TParamDocument,
  TPermissionSudo,
} from '@zkdb/common';
import {
  OwnershipAndPermission,
  Permission,
  PermissionBase,
} from '@zkdb/permission';
import { ClientSession } from 'mongodb';
import { Database } from './database';

export class PermissionSecurity {
  // List all groups of a user
  public static async listGroupOfUser(
    databaseName: string,
    userName: string,
    session?: ClientSession
  ): Promise<string[]> {
    const imUserGroup = new ModelUserGroup(databaseName);
    const userGroup = await imUserGroup.listGroupByUserQuery(
      { userName },
      {
        session,
      }
    );
    return userGroup.map((group) => group.groupName);
  }

  // Get permission of a database
  public static async database(
    paramDatabase: TParamDatabase,
    session?: ClientSession
  ): Promise<PermissionBase> {
    const { databaseName, actor } = paramDatabase;
    // If user is database owner then return all system permissions
    if (
      await Database.isOwner({ databaseName, databaseOwner: actor }, session)
    ) {
      return PermissionBase.permissionAll();
    }
    return PermissionBase.permissionNone();
  }

  // Get permission of a collection
  public static async collection(
    paramCollection: TPermissionSudo<TParamCollection>,
    session?: ClientSession
  ): Promise<PermissionBase> {
    const { databaseName, collectionName, actor, sudo } = paramCollection;
    // If user is database owner then return all system permissions
    if (await Database.isOwner({ databaseName, databaseOwner: actor })) {
      return PermissionBase.permissionAll();
    }
    const imMetadataCollection =
      ModelMetadataCollection.getInstance(databaseName);
    // If ownership and permission is not provided then fetch from metadata collection
    const metadata =
      sudo ||
      (await imMetadataCollection.findOne(
        {
          collectionName,
        },
        { session }
      ));

    const listGroup = await PermissionSecurity.listGroupOfUser(
      databaseName,
      actor,
      session
    );

    return PermissionSecurity.requiredPermission(
      actor,
      listGroup,
      metadata || undefined
    );
  }

  // Get permission of a collection
  public static async document(
    paramDocument: TPermissionSudo<TParamDocument>,
    session?: ClientSession
  ): Promise<PermissionBase> {
    const { databaseName, collectionName, docId, actor, sudo } = paramDocument;
    // If user is database owner then return all system permissions
    if (await Database.isOwner({ databaseName, databaseOwner: actor })) {
      return PermissionBase.permissionAll();
    }
    const imMetadataDocument = new ModelMetadataDocument(databaseName);
    // Ownership and permission of document is not provided then we're going to check in the database
    const metadata =
      sudo ||
      (await imMetadataDocument.findOne(
        {
          collectionName,
          docId,
        },
        { session }
      ));
    const listGroup = await PermissionSecurity.listGroupOfUser(
      databaseName,
      actor,
      session
    );

    return PermissionSecurity.requiredPermission(
      actor,
      listGroup,
      metadata || undefined
    );
  }

  // Get permission based on ownership
  private static requiredPermission(
    actor: string,
    listActorGroup: string[],
    ownership?: OwnershipAndPermission
  ): PermissionBase {
    if (
      !ownership ||
      typeof ownership?.group !== 'string' ||
      typeof ownership?.owner !== 'string' ||
      typeof ownership?.permission !== 'number'
    ) {
      throw new Error('Metadata of given object not found');
    }
    // Actor is owner
    if (actor === ownership.owner) {
      return Permission.from(ownership.permission).owner;
    }
    // Actor is in group
    if (listActorGroup.includes(ownership.group)) {
      return Permission.from(ownership.permission).group;
    }
    // Actor is other
    return Permission.from(ownership.permission).other;
  }

  // Check if permission match a required permission
  private static requiredPermissionMatch(
    actor: string,
    listActorGroup: string[],
    ownership: OwnershipAndPermission | undefined,
    requiredPermission: PermissionBase
  ) {
    return PermissionSecurity.requiredPermission(
      actor,
      listActorGroup,
      ownership
    ).contain(requiredPermission);
  }

  public static async filterMetadataCollection(
    databaseName: string,
    listCollection: TCollectionMetadataRecord[],
    actor: string,
    requiredPermission: PermissionBase,
    session?: ClientSession
  ): Promise<TCollectionMetadataRecord[]> {
    // If user is database owner then return all system permissions
    if (await Database.isOwner({ databaseName, databaseOwner: actor })) {
      return listCollection;
    }

    const listGroup = await PermissionSecurity.listGroupOfUser(
      databaseName,
      actor,
      session
    );

    return listCollection.filter((currentCollection) =>
      PermissionSecurity.requiredPermissionMatch(
        actor,
        listGroup,
        {
          permission: currentCollection.permission,
          owner: currentCollection.owner,
          group: currentCollection.group,
        },
        requiredPermission
      )
    );
  }

  // Filter a document list by required permission
  public static async filterDocument(
    databaseName: string,
    collectionName: string,
    listDoc: TDocumentRecordNullable[],
    actor: string,
    requirePermission: PermissionBase,
    session?: ClientSession
  ): Promise<TDocumentRecordNullable[]> {
    // If user is database owner then return all system permissions
    if (await Database.isOwner({ databaseName, databaseOwner: actor })) {
      return listDoc;
    }

    const imMetadataDocument = new ModelMetadataDocument(databaseName);
    const listDocId = listDoc.map((doc) => doc.docId);
    const listMetadata: TDocumentMetadata[] = await imMetadataDocument
      .find(
        {
          $and: [{ collectionName }, { docId: { $in: listDocId } }],
        },
        { session }
      )
      .toArray();
    const metadataMap = new Map(
      listMetadata.map((metadata) => [metadata.docId, metadata])
    );
    const listGroup = await PermissionSecurity.listGroupOfUser(
      databaseName,
      actor,
      session
    );

    return listDoc.filter(
      (currentDoc) =>
        metadataMap.has(currentDoc.docId) &&
        PermissionSecurity.requiredPermissionMatch(
          actor,
          listGroup,
          metadataMap.get(currentDoc.docId),
          requirePermission
        )
    );
  }

  // Only owner will be allowed to set permission
  public static async setPermission(
    databaseName: string,
    collectionName: string,
    docId: string | undefined,
    actor: string,
    permission: Permission,
    session?: ClientSession
  ): Promise<boolean> {
    if (docId) {
      const imMetadataDocument = new ModelMetadataDocument(databaseName);
      const documentMetadata = await imMetadataDocument.findOne({
        collectionName,
        docId,
      });
      if (actor !== documentMetadata?.owner) {
        throw new Error(`Actor ${actor} is not owner of document ${docId}`);
      }
      const result = await imMetadataDocument.updateOne(
        {
          collectionName,
          docId,
        },
        { $set: { permission: permission.value } },
        { session }
      );
      return result.acknowledged;
    } 
      const imMetadataCollection =
        ModelMetadataCollection.getInstance(databaseName);
      const collectionMetadata = await imMetadataCollection.findOne({
        collectionName,
      });
      if (actor !== collectionMetadata?.owner) {
        throw new Error(
          `Actor ${actor} is not owner of collection ${collectionName}`
        );
      }
      const result = await imMetadataCollection.updateOne(
        {
          collectionName,
        },
        { $set: { permission: permission.value } },
        { session }
      );
      return result.acknowledged;
    
  }
}
