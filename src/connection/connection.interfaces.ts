import { Document } from '../document/document.class';
import { GenericDoc } from './../document/document.interfaces';
import { DocumentChangeType } from './connection.enums';

export interface DocumentChangedEvent {
  type: DocumentChangeType;
  doc: Document;
}

export type EncryptionCallback = (docs: GenericDoc[]) => Promise<GenericDoc[]>;
export type DecryptionCallback = (docs: GenericDoc[]) => Promise<GenericDoc[]>;
