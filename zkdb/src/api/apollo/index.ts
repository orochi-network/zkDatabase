import { resolversDocument, typeDefsDocument } from './app/document.js';
import { typeDefsMetadata, resolversMetadata } from './app/metadata.js';

export const TypedefsApp = [typeDefsMetadata, typeDefsDocument];

export const ResolversApp = [resolversMetadata, resolversDocument];
