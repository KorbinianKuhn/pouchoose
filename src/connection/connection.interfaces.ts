import { Document } from '../document/document.class';
import { DocumentChangeType } from './connection.enums';

export interface DocumentChangedEvent {
  type: DocumentChangeType;
  doc: Document;
}
