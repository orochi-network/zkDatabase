import {
  Ownership,
  OwnershipAndPermission,
  Permission,
  PermissionBase,
} from '@zkdb/permission';
import { ClientSession } from 'mongodb';
import { ModelMetadataCollection } from '../../model/database/metadata-collection.js';
import ModelMetadataDocument from '../../model/database/metadata-document.js';
import ModelUserGroup from '../../model/database/user-group.js';
import { isDatabaseOwner } from './database.js';
import {
  TDocumentRecord,
  TMetadataDetailDocument,
  TMetadataDocument,
} from '@zkdb/common';

export class PermissionSecurity {
  // List all groups of a user
  public static async listGroupOfUser(
    databaseName: string,
    userName: string,
    session?: ClientSession
  ) {
    const imUserGroup = new ModelUserGroup(databaseName);
    const userGroup = await imUserGroup.listGroupByUserName(userName, {
      session,
    });
    return userGroup;
  }

  // Get permission of a database
  public static async database(
    databaseName: string,
    actor: string,
    session?: ClientSession
  ): Promise<PermissionBase> {
    // If user is database owner then return all system permissions
    if (await isDatabaseOwner(databaseName, actor, session)) {
      return PermissionBase.permissionAll();
    }
    return PermissionBase.permissionNone();
  }

  // Get permission of a collection
  public static async collection(
    databaseName: string,
    collectionName: string,
    actor: string,
    session?: ClientSession
  ): Promise<PermissionBase> {
    // If user is database owner then return all system permissions
    if (await isDatabaseOwner(databaseName, actor)) {
      return PermissionBase.permissionAll();
    }
    const imMetadataCollection =
      ModelMetadataCollection.getInstance(databaseName);
    const metadata = await imMetadataCollection.findOne(
      {
        collectionName,
      },
      { session }
    );

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
    databaseName: string,
    collectionName: string,
    docId: string,
    actor: string,
    session?: ClientSession
  ): Promise<PermissionBase> {
    // If user is database owner then return all system permissions
    if (await isDatabaseOwner(databaseName, actor)) {
      return PermissionBase.permissionAll();
    }
    const imMetadataDocument = new ModelMetadataDocument(databaseName);
    const metadata = await imMetadataDocument.findOne(
      {
        collectionName,
        docId,
      },
      { session }
    );
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

  // Filter a document list by required permission
  public static async filterDocument(
    databaseName: string,
    collectionName: string,
    listDoc: TDocumentRecord[],
    actor: string,
    requirePermission: PermissionBase,
    session?: ClientSession
  ): Promise<TDocumentRecord[]> {
    // If user is database owner then return all system permissions
    if (await isDatabaseOwner(databaseName, actor)) {
      return listDoc;
    }

    const imMetadataDocument = new ModelMetadataDocument(databaseName);
    const listDocId = listDoc.map((doc) => doc.docId);
    const listMetadata: TMetadataDocument[] = await imMetadataDocument
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

  // Filter a document list by required permission
  public static async filterMetadataDocumentDetail(
    databaseName: string,
    listDoc: TMetadataDetailDocument<TDocumentRecord>[],
    actor: string,
    requirePermission: PermissionBase,
    session?: ClientSession
  ): Promise<TMetadataDetailDocument<TDocumentRecord>[]> {
    // If user is database owner then return all system permissions
    if (await isDatabaseOwner(databaseName, actor)) {
      return listDoc;
    }

    const listGroup = await PermissionSecurity.listGroupOfUser(
      databaseName,
      actor,
      session
    );

    return listDoc.filter((currentDoc) =>
      PermissionSecurity.requiredPermissionMatch(
        actor,
        listGroup,
        currentDoc.metadata,
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
    permission: PermissionBase,
    session?: ClientSession
  ): Promise<boolean> {
    if (docId) {
      const imMetadataDocument = new ModelMetadataDocument(databaseName);
      const documentMetadata = await imMetadataDocument.findOne({
        collectionName,
        docId,
      });
      if (actor !== documentMetadata?.owner) {
        throw new Error(
          `Permission ${actor} is not owner of document ${docId}`
        );
      }
      const result = await imMetadataDocument.updateOne(
        {
          collectionName,
          docId,
        },
        { $set: { permission } },
        { session }
      );
      return result.acknowledged;
    } else {
      const imMetadataCollection =
        ModelMetadataCollection.getInstance(databaseName);
      const collectionMetadata = await imMetadataCollection.findOne({
        collectionName,
      });
      if (actor !== collectionMetadata?.owner) {
        throw new Error(
          `Permission ${actor} is not owner of collection ${collectionName}`
        );
      }
      const result = await imMetadataCollection.updateOne(
        {
          collectionName,
        },
        { $set: { permission } },
        { session }
      );
      return result.acknowledged;
    }
  }
}
